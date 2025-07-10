from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class PropertySiteEnum(str, Enum):
    ALLEGRO = "allegro"
    GETHOME = "gethome"
    NIERUCHOMOSCI = "nieruchomosci"
    OLX = "olx"
    OTODOM = "otodom"

class SortByEnum(str, Enum):
    PRICE_ASC = "price_asc"
    PRICE_DESC = "price_desc"
    NEWEST = "newest"
    OLDEST = "oldest"

class PropertyBase(BaseModel):
    title: str
    price: int
    area: Optional[int] = None
    rooms: Optional[int] = None
    level: Optional[int] = None
    address: str
    image: Optional[str] = None
    link: str
    site: str

class PropertyResponse(PropertyBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PropertyFilters(BaseModel):
    sites: Optional[List[PropertySiteEnum]] = None
    price_min: Optional[int] = None
    price_max: Optional[int] = None
    area_min: Optional[int] = None
    area_max: Optional[int] = None
    rooms_min: Optional[int] = None
    rooms_max: Optional[int] = None
    level_min: Optional[int] = None
    level_max: Optional[int] = None
    address: Optional[str] = None
    sort_by: SortByEnum = SortByEnum.PRICE_ASC

class ScrapeRequest(BaseModel):
    city: str = Field(..., min_length=2, max_length=50)

class ScrapeResponse(BaseModel):
    jobId: str
    message: str

class ScrapingJobResponse(BaseModel):
    id: str
    city: str
    status: str
    progress: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    total_found: int
    error: Optional[str] = None

    class Config:
        from_attributes = True
