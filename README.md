# Mieszkanieo - Polish real estate aggregator

A desktop application aimed for Polish users for scraping and browsing real estate listings from multiple sources.

## Overview

Mieszkanieo is a real estate aggregator that scrapes property listings from major Polish real estate websites and presents them in a unified interface. The app features real-time data refresh and advanced filtering capabilities.

## Technologies

### Frontend
- **React** + **TypeScript** - UI framework
- **Tailwind CSS** + **Radix UI** - Styling
- **Vite** - Build tool

### Backend
- **Node.js** + **Express** - REST API server
- **SQLite** - Database
- **Python** - Web scraping engine
- **Selenium** + **undetected-chromedriver** - Browser automation
- **BeautifulSoup** - HTML parsing

### Desktop App
- **Tauri v2** - Desktop application framework
- **Rust** - Native backend

### Data Sources
- Allegro.pl
- GetHome.pl
- Nieruchomosci-online.pl
- OLX.pl
- Otodom.pl

## Features

- **Multi-source scraping** from 5 major Polish real estate sites
- **Auto-updating ChromeDriver** long-term compatibility system
- **Dark/Light mode** with theme persistence
- **Responsive design** with advanced filtering
- **Real-time progress** tracking for scraping jobs
- **Local SQLite database** for fast property browsing
- **Portable executable** with embedded dependencies

## Setup & Development

### Prerequisites
- **Node.js** (v18+)
- **Rust** (latest stable)
- **Python** (embedded in redistributable folder)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/nokocu/mieszkanieo.git
   cd mieszkanieo
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   cd backend && npm install && cd ..
   ```

3. **Development mode**
   ```bash
   npm run tauri:debug
   ```

4. **Production build**
   ```bash
   npm run tauri:release
   ```

### Build Scripts

- `npm run frontend:dev` - Start frontend development server
- `npm run frontend:build` - Build frontend for production
- `npm run backend:dev` - Start backend in watch mode
- `npm run backend:build` - Compile TypeScript backend
- `npm run tauri:debug` - Build debug version and prepare debug folder
- `npm run tauri:release` - Build production version and prepare release folder

### Manual Build Steps

1. **Build frontend**: `cd frontend && npm run build`
2. **Build backend**: `cd backend && npm run build`  
3. **Build Tauri app**: `cd src-tauri && cargo tauri build`
4. **Prepare release**: Run `scripts/release.bat` (Windows)

## Project Structure

```
├── frontend/          # React + TypeScript UI
├── backend/           # Express API + SQLite
│   ├── scraper/       # Python scraping modules
│   ├── services/      # ChromeDriver management
│   └── server.ts      # Main API server
├── src-tauri/         # Tauri desktop app
├── scripts/           # Build automation
├── redistributable/   # Embedded Python + Node.js
```

## License

Private project by [@nokocu](https://github.com/nokocu)
