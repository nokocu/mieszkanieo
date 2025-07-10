import uuid
import asyncio
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import BackgroundTasks

from models import ScrapingJob
from schemas import ScrapingJobResponse
from .modern_scraper import ModernScraper
from .property_service import PropertyService

class ScraperService:
    """service for managing scraping jobs and operations"""
    
    def __init__(self):
        self.property_service = PropertyService()
        self.active_jobs = {}  # track running jobs
    
    def start_scraping_job(self, db: Session, city: str, background_tasks: BackgroundTasks) -> str:
        """start a new scraping job"""
        
        # check if theres already a recent job for this city
        existing_job = db.query(ScrapingJob).filter(
            ScrapingJob.city == city.lower(),
            ScrapingJob.status.in_(["pending", "running"])
        ).first()
        
        if existing_job:
            return existing_job.id
        
        # create new job
        job_id = str(uuid.uuid4())
        
        job = ScrapingJob(
            id=job_id,
            city=city.lower(),
            status="pending",
            progress=0,
            total_found=0
        )
        
        db.add(job)
        db.commit()
        
        # start background scraping task
        background_tasks.add_task(self._run_scraping_job, job_id, city.lower())
        
        return job_id
    
    async def _run_scraping_job(self, job_id: str, city: str):
        """run the actual scraping process"""
        from ..database import SessionLocal
        
        db = SessionLocal()
        scraper = None
        
        try:
            # update job status
            job = db.query(ScrapingJob).filter(ScrapingJob.id == job_id).first()
            if not job:
                return
            
            job.status = "running"
            job.progress = 0
            db.commit()
            
            # initialize scraper
            scraper = ModernScraper(headless=True)
            
            # sites to scrape
            sites = ["gethome", "olx", "allegro", "otodom"]
            total_sites = len(sites)
            
            all_properties = []
            
            for i, site in enumerate(sites):
                try:
                    print(f"scraping {site} for {city}...")
                    
                    # scrape site
                    properties = scraper.scrape_site(site, city, max_pages=3)
                    all_properties.extend(properties)
                    
                    # update progress
                    progress = int(((i + 1) / total_sites) * 100)
                    job.progress = progress
                    db.commit()
                    
                    print(f"found {len(properties)} properties on {site}")
                    
                    # small delay between sites
                    await asyncio.sleep(2)
                    
                except Exception as e:
                    print(f"error scraping {site}: {e}")
                    continue
            
            # save properties to database
            saved_count = 0
            for prop_data in all_properties:
                try:
                    if self._is_valid_property(prop_data):
                        saved_prop = self.property_service.update_or_create_property(db, prop_data)
                        if saved_prop:
                            saved_count += 1
                except Exception as e:
                    print(f"error saving property: {e}")
                    continue
            
            # update job completion
            job.status = "completed"
            job.progress = 100
            job.total_found = saved_count
            job.completed_at = datetime.utcnow()
            db.commit()
            
            print(f"scraping job {job_id} completed: {saved_count} properties saved")
            
        except Exception as e:
            # handle job failure
            print(f"scraping job {job_id} failed: {e}")
            
            job = db.query(ScrapingJob).filter(ScrapingJob.id == job_id).first()
            if job:
                job.status = "failed"
                job.error = str(e)
                db.commit()
                
        finally:
            # cleanup
            if scraper:
                scraper.cleanup()
            if job_id in self.active_jobs:
                del self.active_jobs[job_id]
            db.close()
    
    def get_job_status(self, db: Session, job_id: str) -> Optional[ScrapingJobResponse]:
        """get status of a scraping job"""
        job = db.query(ScrapingJob).filter(ScrapingJob.id == job_id).first()
        
        if not job:
            return None
            
        return ScrapingJobResponse.from_orm(job)
    
    def get_recent_jobs(self, db: Session, limit: int = 10) -> list[ScrapingJobResponse]:
        """get recent scraping jobs"""
        jobs = db.query(ScrapingJob).order_by(
            ScrapingJob.started_at.desc()
        ).limit(limit).all()
        
        return [ScrapingJobResponse.from_orm(job) for job in jobs]
    
    def cleanup_old_jobs(self, db: Session, days: int = 7):
        """cleanup old completed jobs"""
        from datetime import timedelta
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        deleted_count = db.query(ScrapingJob).filter(
            ScrapingJob.started_at < cutoff_date,
            ScrapingJob.status.in_(["completed", "failed"])
        ).delete()
        
        db.commit()
        return deleted_count
    
    def _is_valid_property(self, prop_data: dict) -> bool:
        """validate property data before saving"""
        required_fields = ['title', 'price', 'link', 'site', 'address']
        
        for field in required_fields:
            if not prop_data.get(field):
                return False
        
        # validate price is numeric
        try:
            price = int(prop_data['price']) if prop_data['price'] else 0
            if price <= 0:
                return False
        except (ValueError, TypeError):
            return False
        
        # validate link format
        link = prop_data.get('link', '')
        if not link.startswith('http'):
            return False
        
        return True
