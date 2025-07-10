from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./real_estate.db")

# for sqlite, we need to enable foreign key constraints
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """database dependency for fastapi"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
