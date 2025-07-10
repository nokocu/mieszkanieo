from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Enum
from sqlalchemy.sql import func
from database import Base
import enum

class PropertySite(enum.Enum):
    ALLEGRO = "allegro"
    GETHOME = "gethome"
    NIERUCHOMOSCI = "nieruchomosci"
    OLX = "olx"
    OTODOM = "otodom"

class Property(Base):
    __tablename__ = "properties"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    price = Column(Integer, nullable=False)
    area = Column(Integer, nullable=True)
    rooms = Column(Integer, nullable=True)
    level = Column(Integer, nullable=True)
    address = Column(Text, nullable=False)
    image = Column(String, nullable=True)
    link = Column(String, nullable=False, unique=True, index=True)
    site = Column(String, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

class ScrapingJob(Base):
    __tablename__ = "scraping_jobs"

    id = Column(String, primary_key=True, index=True)
    city = Column(String, nullable=False, index=True)
    status = Column(String, nullable=False, default="pending")
    progress = Column(Integer, default=0)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    total_found = Column(Integer, default=0)
    error = Column(Text, nullable=True)
