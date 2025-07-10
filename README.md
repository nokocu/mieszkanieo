# Mieszkanieo - Real Estate Platform

Real estate listing aggregator for the Polish market. Scrapes multiple sites and provides unified search with advanced filtering.

## Tech Stack

**Frontend:** React + TypeScript + Vite  
**Backend:** FastAPI + Python  
**Database:** PostgreSQL + SQLAlchemy  
**Scraping:** Selenium + BeautifulSoup  
**DevOps:** Docker + Docker Compose  

## Features

- Multi-site scraping - Allegro, OLX, GetHome, Otodom, Nieruchomości Online
- Advanced filtering by price, area, rooms, floor level, location
- Background job processing for data collection
- Responsive web interface with real-time updates

## Quick Start

```bash
# Clone and setup
git clone <repo-url>
cd delta-real-estate

# With Docker (recommended)
docker-compose up -d

# Manual setup
cd backend && pip install -r requirements.txt
cd .. && npm install
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

## API Usage

Get properties:
```http
GET /api/properties?city=krakow&price_min=1000&price_max=3000
```

Start scraping:
```http
POST /api/scrape
{"city": "warszawa"}
```

## Architecture

```
React Frontend ↔ FastAPI Backend ↔ PostgreSQL Database
                      ↓
              Selenium Scraper Engine
```

Simple, scalable architecture with clear separation of concerns.