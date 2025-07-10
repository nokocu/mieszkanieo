#!/bin/bash

# Docker Helper Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    # Try direct command first
    if command -v docker &> /dev/null; then
        return 0
    fi
    
    # Try through Windows cmd if direct command fails
    if cmd.exe /c "docker --version" &> /dev/null; then
        print_warning "Docker found via Windows cmd. Consider adding Docker to your bash PATH."
        # Create wrapper functions for this session
        docker() { cmd.exe /c "docker $*"; }
        docker-compose() { cmd.exe /c "docker-compose $*"; }
        export -f docker docker-compose
        return 0
    fi
    
    print_error "Docker is not installed or not accessible. Please install Docker Desktop first."
    exit 1
}

# Show help
show_help() {
    echo "mieszkanieo - Docker Helper"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start all services"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  build     Build all services"
    echo "  logs      Show logs for all services"
    echo "  status    Show status of all services"
    echo "  clean     Clean up containers and volumes"
    echo "  dev       Start in development mode"
    echo "  help      Show this help message"
    echo ""
}

# Start services
start_services() {
    print_status "Starting mieszkanieo Real Estate Platform..."
    docker-compose up -d
    print_status "Services started successfully!"
    print_status "Frontend: http://localhost:3000"
    print_status "Backend API: http://localhost:8000"
    print_status "API Docs: http://localhost:8000/docs"
}

# Stop services
stop_services() {
    print_status "Stopping all services..."
    docker-compose down
    print_status "Services stopped successfully!"
}

# Restart services
restart_services() {
    print_status "Restarting all services..."
    docker-compose down
    docker-compose up -d
    print_status "Services restarted successfully!"
}

# Build services
build_services() {
    print_status "Building all services..."
    docker-compose build
    print_status "Build completed successfully!"
}

# Show logs
show_logs() {
    print_status "Showing logs (Ctrl+C to exit)..."
    docker-compose logs -f
}

# Show status
show_status() {
    print_status "Service status:"
    docker-compose ps
}

# Clean up
clean_up() {
    print_warning "This will remove all containers and volumes. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Cleaning up..."
        docker-compose down -v
        docker system prune -f
        print_status "Cleanup completed!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Development mode
dev_mode() {
    print_status "Starting in development mode..."
    docker-compose up --build
}

# Main script logic
main() {
    check_docker

    case "${1:-help}" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        build)
            build_services
            ;;
        logs)
            show_logs
            ;;
        status)
            show_status
            ;;
        clean)
            clean_up
            ;;
        dev)
            dev_mode
            ;;
        help|*)
            show_help
            ;;
    esac
}

main "$@"
