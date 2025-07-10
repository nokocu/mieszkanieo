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
- Real-time filter updates with expandable navbar interface
- Responsive web interface with modern Bootstrap 5 design
- Background job processing for data collection

## Quick Start

## Quick Start

### Prerequisites

For Docker setup, you'll need:
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download here](https://git-scm.com/downloads)

### Using Docker (Recommended)

The easiest way to run the entire application:

```bash
# Clone the repository
git clone <repo-url>
cd delta

# Copy environment file
copy .env.example .env  # Windows
# cp .env.example .env  # Mac/Linux

# Start all services with Docker Compose
docker-compose up -d

# Or use the helper scripts
./docker.sh start     # Linux/Mac
docker.bat start      # Windows

# Or use npm scripts
npm run docker:start
```

**Access Points:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Database: localhost:5432

### Manual Development Setup

For development without Docker:

```bash
# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd ..
npm install

# Run both services
npm run backend  # Terminal 1
npm run frontend # Terminal 2
```

### Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Start in background
docker-compose up -d

# View service logs
docker-compose logs -f [service_name]

# Stop all services
docker-compose down

# Remove volumes (reset database)
docker-compose down -v

# Rebuild specific service
docker-compose build [service_name]

# Using npm scripts
npm run docker:start    # Start services
npm run docker:stop     # Stop services
npm run docker:build    # Build services
npm run docker:dev      # Start in foreground
npm run docker:logs     # View logs
npm run docker:clean    # Clean up volumes
```

## API Usage

Get properties:
```http
GET /api/properties?sites=gethome&sites=olx&price_min=1000&price_max=3000
```

Start scraping:
```http
POST /api/scrape
{"city": "warszawa"}
```

All API endpoints are available at `http://localhost:8001` when using Docker.

## Architecture

```
React Frontend ↔ FastAPI Backend ↔ PostgreSQL Database
                      ↓
              Selenium Scraper Engine
```

Simple, scalable architecture with clear separation of concerns.