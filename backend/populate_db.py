#!/usr/bin/env python3
"""Script to populate the database with sample data for testing"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Property, Base
from database import engine
import os
from datetime import datetime

def populate_database():
    """Add sample properties to the database"""
    
    # create tables
    Base.metadata.create_all(bind=engine)
    
    # create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # check if we already have data
        existing_count = db.query(Property).count()
        if existing_count > 0:
            print(f"Database already has {existing_count} properties. Skipping population.")
            return
        
        # sample properties data
        sample_properties = [
            {
                "id": "prop_1",
                "title": "Test 1",
                "price": 3200,
                "area": 50,
                "rooms": 2,
                "level": 4,
                "address": "Ul. Floriańska 15, Kraków",
                "image": "https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Krakow+Apartment",
                "link": "https://example.com/property/1",
                "site": "gethome"
            },
            {
                "id": "prop_2",
                "title": "Test 2",
                "price": 2100,
                "area": 35,
                "rooms": 1,
                "level": 2,
                "address": "Ul. Grodzka 8, Kraków",
                "image": "https://via.placeholder.com/300x200/2196F3/FFFFFF?text=Modern+Studio",
                "link": "https://example.com/property/2",
                "site": "olx"
            },
            {
                "id": "prop_3",
                "title": "Test 3",
                "price": 4500,
                "area": 75,
                "rooms": 3,
                "level": 1,
                "address": "Ul. Kazimierza 22, Kraków",
                "image": "https://via.placeholder.com/300x200/FF9800/FFFFFF?text=3+Room+Balcony",
                "link": "https://example.com/property/3",
                "site": "gethome"
            },
            {
                "id": "prop_4",
                "title": "Test 4",
                "price": 8900,
                "area": 120,
                "rooms": 4,
                "level": 10,
                "address": "Ul. Dietla 67, Kraków",
                "image": "https://via.placeholder.com/300x200/9C27B0/FFFFFF?text=Luxury+Penthouse",
                "link": "https://example.com/property/4",
                "site": "otodom"
            },
            {
                "id": "prop_5",
                "title": "Test 5",
                "price": 1800,
                "area": 30,
                "rooms": 1,
                "level": 3,
                "address": "Ul. Gołębia 13, Kraków",
                "image": "https://via.placeholder.com/300x200/E91E63/FFFFFF?text=University+Area",
                "link": "https://example.com/property/5",
                "site": "olx"
            }
        ]
        
        # add properties to database
        for prop_data in sample_properties:
            property_obj = Property(
                id=prop_data["id"],
                title=prop_data["title"],
                price=prop_data["price"],
                area=prop_data["area"],
                rooms=prop_data["rooms"],
                level=prop_data["level"],
                address=prop_data["address"],
                image=prop_data["image"],
                link=prop_data["link"],
                site=prop_data["site"]
            )
            db.add(property_obj)
        
        # commit
        db.commit()
        print(f"Successfully added {len(sample_properties)} sample properties to the database!")
        
        # verify
        total_properties = db.query(Property).count()
        print(f"Total properties in database: {total_properties}")
        
    except Exception as e:
        print(f"Error populating database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    populate_database()
