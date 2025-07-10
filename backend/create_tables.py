"""
creates all tables defined in models.py
"""

from database import engine, Base
from models import Property, ScrapingJob

def create_tables():
    """Create all database tables"""
    try:
        print("creating database tables")
        Base.metadata.create_all(bind=engine)
        print("database tables created")
        
        # Verify tables exist
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        print(f"available tables: {', '.join(tables)}")
        
    except Exception as e:
        print(f"error creating tables: {e}")

if __name__ == "__main__":
    create_tables()
