from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from dotenv import load_dotenv

from database import get_db, engine
from models import Base
from schemas import PropertyResponse, PropertyFilters, ScrapeRequest, ScrapeResponse, PropertySiteEnum, SortByEnum
from services.property_service import PropertyService
from services.scraper_service import ScraperService

# load environment variables
load_dotenv()

# create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Delta Real Estate API",
    description="Professional real estate scraping and filtering API",
    version="1.0.0"
)

# cors middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# dependency function for query parameters
def get_property_filters(
    city: str = Query(default="krak"),
    sites: Optional[List[str]] = Query(default=None),
    price_min: Optional[int] = Query(default=None),
    price_max: Optional[int] = Query(default=None),
    area_min: Optional[int] = Query(default=None),
    area_max: Optional[int] = Query(default=None),
    rooms_min: Optional[int] = Query(default=None),
    rooms_max: Optional[int] = Query(default=None),
    level_min: Optional[int] = Query(default=None),
    level_max: Optional[int] = Query(default=None),
    address: Optional[str] = Query(default=None),
    sort_by: SortByEnum = Query(default=SortByEnum.PRICE_ASC)
) -> PropertyFilters:
    # Convert string sites to PropertySiteEnum if provided
    site_enums = None
    if sites:
        site_enums = [PropertySiteEnum(site) for site in sites if site in PropertySiteEnum.__members__.values()]
    
    return PropertyFilters(
        city=city,
        sites=site_enums,
        price_min=price_min,
        price_max=price_max,
        area_min=area_min,
        area_max=area_max,
        rooms_min=rooms_min,
        rooms_max=rooms_max,
        level_min=level_min,
        level_max=level_max,
        address=address,
        sort_by=sort_by
    )

# services
property_service = PropertyService()
scraper_service = ScraperService()

@app.get("/api/properties", response_model=List[PropertyResponse])
async def get_properties(
    filters: PropertyFilters = Depends(get_property_filters),
    db: Session = Depends(get_db)
):
    """get filtered properties from database"""
    try:
        properties = property_service.get_filtered_properties(db, filters)
        return properties
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scrape", response_model=ScrapeResponse)
async def start_scraping(
    request: ScrapeRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """start scraping process for a city"""
    try:
        job_id = scraper_service.start_scraping_job(
            db, request.city, background_tasks
        )
        return ScrapeResponse(
            jobId=job_id,
            message=f"scraping started for {request.city}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scrape/status/{job_id}")
async def get_scraping_status(job_id: str, db: Session = Depends(get_db)):
    """get status of scraping job"""
    try:
        status = scraper_service.get_job_status(db, job_id)
        if not status:
            raise HTTPException(status_code=404, detail="job not found")
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """health check endpoint"""
    return {"status": "healthy", "message": "delta real estate api is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
