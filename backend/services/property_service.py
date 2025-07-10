from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from models import Property, PropertySite
from schemas import PropertyFilters, PropertyResponse

class PropertyService:
    """service for managing property data and filtering"""
    
    def get_filtered_properties(self, db: Session, filters: PropertyFilters) -> List[PropertyResponse]:
        """get properties with applied filters"""
        query = db.query(Property)
        
        # site filters
        if filters.sites is not None:
            if len(filters.sites) == 0:
                # If sites array is empty but not None, show no results
                query = query.filter(Property.site.in_([]))
            else:
                site_names = [site.value for site in filters.sites]
                query = query.filter(Property.site.in_(site_names))
        
        # price filters
        if filters.price_min is not None:
            query = query.filter(Property.price >= filters.price_min)
        if filters.price_max is not None:
            query = query.filter(Property.price <= filters.price_max)
        
        # area filters
        if filters.area_min is not None:
            query = query.filter(Property.area >= filters.area_min)
        if filters.area_max is not None:
            query = query.filter(Property.area <= filters.area_max)
        
        # rooms filters
        if filters.rooms_min is not None:
            query = query.filter(Property.rooms >= filters.rooms_min)
        if filters.rooms_max is not None:
            query = query.filter(Property.rooms <= filters.rooms_max)
        
        # level filters
        if filters.level_min is not None:
            query = query.filter(Property.level >= filters.level_min)
        if filters.level_max is not None:
            query = query.filter(Property.level <= filters.level_max)
        
        # address contains filter
        if filters.address and filters.address.strip():
            address_filter = f"%{filters.address.lower()}%"
            query = query.filter(Property.address.ilike(address_filter))
        
        # sorting
        if filters.sort_by == "price_asc":
            query = query.order_by(asc(Property.price))
        elif filters.sort_by == "price_desc":
            query = query.order_by(desc(Property.price))
        elif filters.sort_by == "newest":
            query = query.order_by(desc(Property.created_at))
        elif filters.sort_by == "oldest":
            query = query.order_by(asc(Property.created_at))
        else:
            # default sorting
            query = query.order_by(asc(Property.price))
        
        # limit results to prevent overload
        properties = query.limit(1000).all()
        
        return [PropertyResponse.from_orm(prop) for prop in properties]
    
    def create_property(self, db: Session, property_data: dict) -> Property:
        """create new property record"""
        # convert string values to integers where needed
        if property_data.get('price'):
            property_data['price'] = int(property_data['price']) if property_data['price'] else 0
        if property_data.get('area'):
            property_data['area'] = int(property_data['area']) if property_data['area'] else None
        if property_data.get('rooms'):
            property_data['rooms'] = int(property_data['rooms']) if property_data['rooms'] else None
        if property_data.get('level'):
            property_data['level'] = int(property_data['level']) if property_data['level'] else None
            
        # ensure required fields
        if not property_data.get('title') or not property_data.get('price'):
            return None
            
        property_obj = Property(**property_data)
        db.add(property_obj)
        db.commit()
        db.refresh(property_obj)
        return property_obj
    
    def update_or_create_property(self, db: Session, property_data: dict) -> Property:
        """update existing property or create new one"""
        existing = db.query(Property).filter(Property.link == property_data['link']).first()
        
        if existing:
            # update existing property
            for key, value in property_data.items():
                if hasattr(existing, key) and value is not None:
                    setattr(existing, key, value)
            db.commit()
            db.refresh(existing)
            return existing
        else:
            # create new property
            return self.create_property(db, property_data)
    
    def delete_old_properties(self, db: Session, days: int = 30):
        """delete properties older than specified days"""
        from datetime import datetime, timedelta
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        deleted_count = db.query(Property).filter(
            Property.created_at < cutoff_date
        ).delete()
        
        db.commit()
        return deleted_count
    
    def get_property_stats(self, db: Session, city: str = None) -> dict:
        """get statistics about properties"""
        query = db.query(Property)
        
        if city:
            city_filter = f"%{city.lower()}%"
            query = query.filter(Property.address.ilike(city_filter))
        
        total_count = query.count()
        
        if total_count == 0:
            return {
                "total": 0,
                "avg_price": 0,
                "min_price": 0,
                "max_price": 0,
                "by_site": {}
            }
        
        properties = query.all()
        prices = [p.price for p in properties if p.price]
        
        stats = {
            "total": total_count,
            "avg_price": sum(prices) // len(prices) if prices else 0,
            "min_price": min(prices) if prices else 0,
            "max_price": max(prices) if prices else 0,
            "by_site": {}
        }
        
        # count by site
        for site in PropertySite:
            site_count = sum(1 for p in properties if p.site == site.value)
            stats["by_site"][site.value] = site_count
        
        return stats
