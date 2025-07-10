@echo off
REM Docker Helper Script for Windows

setlocal enabledelayedexpansion

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

REM Show help function
if "%1"=="" goto :show_help
if "%1"=="help" goto :show_help

REM Handle commands
if "%1"=="start" goto :start_services
if "%1"=="stop" goto :stop_services
if "%1"=="restart" goto :restart_services
if "%1"=="build" goto :build_services
if "%1"=="logs" goto :show_logs
if "%1"=="status" goto :show_status
if "%1"=="clean" goto :clean_up
if "%1"=="dev" goto :dev_mode

goto :show_help

:show_help
echo Delta Real Estate Platform - Docker Helper
echo.
echo Usage: docker.bat [COMMAND]
echo.
echo Commands:
echo   start     Start all services
echo   stop      Stop all services
echo   restart   Restart all services
echo   build     Build all services
echo   logs      Show logs for all services
echo   status    Show status of all services
echo   clean     Clean up containers and volumes
echo   dev       Start in development mode
echo   help      Show this help message
echo.
goto :end

:start_services
echo [INFO] Starting Delta Real Estate Platform...
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] Failed to start services
    goto :end
)
echo [INFO] Services started successfully!
echo [INFO] Frontend: http://localhost:3000
echo [INFO] Backend API: http://localhost:8000
echo [INFO] API Docs: http://localhost:8000/docs
goto :end

:stop_services
echo [INFO] Stopping all services...
docker-compose down
echo [INFO] Services stopped successfully!
goto :end

:restart_services
echo [INFO] Restarting all services...
docker-compose down
docker-compose up -d
echo [INFO] Services restarted successfully!
goto :end

:build_services
echo [INFO] Building all services...
docker-compose build
echo [INFO] Build completed successfully!
goto :end

:show_logs
echo [INFO] Showing logs (Ctrl+C to exit)...
docker-compose logs -f
goto :end

:show_status
echo [INFO] Service status:
docker-compose ps
goto :end

:clean_up
echo [WARNING] This will remove all containers and volumes. Are you sure? (y/N)
set /p response=
if /i "!response!"=="y" (
    echo [INFO] Cleaning up...
    docker-compose down -v
    docker system prune -f
    echo [INFO] Cleanup completed!
) else (
    echo [INFO] Cleanup cancelled.
)
goto :end

:dev_mode
echo [INFO] Starting in development mode...
docker-compose up --build
goto :end

:end
