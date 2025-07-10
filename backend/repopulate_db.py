#!/usr/bin/env python3
"""Script to repopulate the database with better test data for each site"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Property, Base
from database import engine
import os
from datetime import datetime

def clear_and_populate_database():
    """Clear existing data and add new sample properties for all sites"""
    
    # create tables
    Base.metadata.create_all(bind=engine)
    
    # create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # clear existing data
        db.query(Property).delete()
        db.commit()
        print("Cleared existing properties from database.")
        
        # Sample properties data - multiple entries per site for better debugging
        sample_properties = [
            # GETHOME properties (3 entries)
            {
                "id": "gethome_1",
                "title": "Beautiful 2-room apartment in Kraków Old Town",
                "price": 3200,
                "area": 50,
                "rooms": 2,
                "level": 4,
                "address": "Ul. Floriańska 15, Kraków",
                "image": "https://via.placeholder.com/300x200/9C27B0/FFFFFF?text=Gethome+1",
                "link": "https://gethome.pl/property/1",
                "site": "gethome"
            },
            {
                "id": "gethome_2",
                "title": "Spacious 3-room apartment with balcony",
                "price": 4500,
                "area": 75,
                "rooms": 3,
                "level": 1,
                "address": "Ul. Kazimierza 22, Kraków",
                "image": "https://via.placeholder.com/300x200/9C27B0/FFFFFF?text=Gethome+2",
                "link": "https://gethome.pl/property/2",
                "site": "gethome"
            },
            {
                "id": "gethome_3",
                "title": "Modern studio in Kazimierz",
                "price": 2800,
                "area": 42,
                "rooms": 1,
                "level": 3,
                "address": "Ul. Szeroka 8, Kraków",
                "image": "https://via.placeholder.com/300x200/9C27B0/FFFFFF?text=Gethome+3",
                "link": "https://gethome.pl/property/3",
                "site": "gethome"
            },
            
            # OLX properties (3 entries)
            {
                "id": "olx_1",
                "title": "Modern studio in city center",
                "price": 2100,
                "area": 35,
                "rooms": 1,
                "level": 2,
                "address": "Ul. Grodzka 8, Kraków",
                "image": "https://via.placeholder.com/300x200/00E5DB/FFFFFF?text=OLX+1",
                "link": "https://olx.pl/property/1",
                "site": "olx"
            },
            {
                "id": "olx_2",
                "title": "Cozy 1-room apartment near university",
                "price": 1800,
                "area": 30,
                "rooms": 1,
                "level": 3,
                "address": "Ul. Gołębia 13, Kraków",
                "image": "https://via.placeholder.com/300x200/00E5DB/FFFFFF?text=OLX+2",
                "link": "https://olx.pl/property/2",
                "site": "olx"
            },
            {
                "id": "olx_3",
                "title": "Affordable 2-room flat",
                "price": 2300,
                "area": 48,
                "rooms": 2,
                "level": 5,
                "address": "Ul. Dietla 45, Kraków",
                "image": "https://via.placeholder.com/300x200/00E5DB/FFFFFF?text=OLX+3",
                "link": "https://olx.pl/property/3",
                "site": "olx"
            },

            # OTODOM properties (3 entries)
            {
                "id": "otodom_1",
                "title": "Luxury penthouse with terrace",
                "price": 8900,
                "area": 120,
                "rooms": 4,
                "level": 10,
                "address": "Ul. Dietla 67, Kraków",
                "image": "https://via.placeholder.com/300x200/3DD37A/FFFFFF?text=Otodom+1",
                "link": "https://otodom.pl/property/1",
                "site": "otodom"
            },
            {
                "id": "otodom_2",
                "title": "Premium 3-room with parking",
                "price": 5200,
                "area": 85,
                "rooms": 3,
                "level": 7,
                "address": "Ul. Karmelicka 12, Kraków",
                "image": "https://via.placeholder.com/300x200/3DD37A/FFFFFF?text=Otodom+2",
                "link": "https://otodom.pl/property/2",
                "site": "otodom"
            },
            {
                "id": "otodom_3",
                "title": "New development apartment",
                "price": 6800,
                "area": 95,
                "rooms": 3,
                "level": 8,
                "address": "Ul. Wadowicka 12, Kraków",
                "image": "https://via.placeholder.com/300x200/3DD37A/FFFFFF?text=Otodom+3",
                "link": "https://otodom.pl/property/3",
                "site": "otodom"
            },

            # ALLEGRO properties (2 entries)
            {
                "id": "allegro_1",
                "title": "Budget-friendly room in shared flat",
                "price": 1200,
                "area": 20,
                "rooms": 1,
                "level": 2,
                "address": "Ul. Św. Tomasza 18, Kraków",
                "image": "https://via.placeholder.com/300x200/FF5C0A/FFFFFF?text=Allegro+1",
                "link": "https://allegro.pl/property/1",
                "site": "allegro"
            },
            {
                "id": "allegro_2",
                "title": "Student accommodation near AGH",
                "price": 1500,
                "area": 25,
                "rooms": 1,
                "level": 4,
                "address": "Ul. Reymonta 7, Kraków",
                "image": "https://via.placeholder.com/300x200/FF5C0A/FFFFFF?text=Allegro+2",
                "link": "https://allegro.pl/property/2",
                "site": "allegro"
            },

            # NIERUCHOMOSCI properties (2 entries)
            {
                "id": "nieruchomosci_1",
                "title": "Family apartment in quiet area",
                "price": 3800,
                "area": 68,
                "rooms": 3,
                "level": 2,
                "address": "Ul. Krowoderska 25, Kraków",
                "image": "https://via.placeholder.com/300x200/666666/FFFFFF?text=Nieruchomosci+1",
                "link": "https://nieruchomosci-online.pl/property/1",
                "site": "nieruchomosci"
            },
            {
                "id": "nieruchomosci_2",
                "title": "Renovated 2-room in Podgórze",
                "price": 2900,
                "area": 52,
                "rooms": 2,
                "level": 1,
                "address": "Ul. Podgórska 33, Kraków",
                "image": "https://via.placeholder.com/300x200/666666/FFFFFF?text=Nieruchomosci+2",
                "link": "https://nieruchomosci-online.pl/property/2",
                "site": "nieruchomosci"
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
        
        # commit the changes
        db.commit()
        print(f"Successfully added {len(sample_properties)} sample properties to the database!")
        
        # show breakdown by site
        for site in ["gethome", "olx", "otodom", "allegro", "nieruchomosci"]:
            count = len([p for p in sample_properties if p["site"] == site])
            print(f"  {site}: {count} properties")
        
        # verify the data
        total_properties = db.query(Property).count()
        print(f"Total properties in database: {total_properties}")
        
    except Exception as e:
        print(f"Error populating database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clear_and_populate_database()
