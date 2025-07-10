from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os
from dotenv import load_dotenv

# load environment variables
load_dotenv()

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

# simple mock data for now
mock_properties = [
    {
        "id": "1",
        "title": "Beautiful 2-room apartment in Kraków",
        "price": 2500,
        "area": 45,
        "rooms": 2,
        "level": 3,
        "address": "Ul. Floriańska 15, Kraków",
        "image": "https://via.placeholder.com/300x200",
        "link": "https://example.com/property/1",
        "site": "gethome",
        "created_at": "2024-01-15T10:30:00Z"
    },
    {
        "id": "2", 
        "title": "Modern studio near city center",
        "price": 1800,
        "area": 35,
        "rooms": 1,
        "level": 2,
        "address": "Ul. Grodzka 8, Kraków",
        "image": "https://via.placeholder.com/300x200",
        "link": "https://example.com/property/2",
        "site": "olx",
        "created_at": "2024-01-14T15:20:00Z"
    }
]

@app.get("/api/properties")
async def get_properties(
    city: str = "krakow",
    price_min: int = None,
    price_max: int = None
):
    """get filtered properties from database"""
    try:
        # simple filtering for demo
        filtered_properties = mock_properties
        
        if price_min:
            filtered_properties = [p for p in filtered_properties if p["price"] >= price_min]
        if price_max:
            filtered_properties = [p for p in filtered_properties if p["price"] <= price_max]
            
        return {
            "success": True,
            "data": filtered_properties,
            "message": f"found {len(filtered_properties)} properties in {city}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scrape")
async def start_scraping(request: dict):
    """start scraping process for a city"""
    try:
        city = request.get("city", "krakow")
        return {
            "success": True,
            "data": {
                "jobId": "mock-job-123",
                "message": f"scraping started for {city}"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """health check endpoint"""
    return {
        "status": "healthy", 
        "message": "delta real estate api is running",
        "environment": "development"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
