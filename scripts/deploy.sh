#!/bin/bash

# CoLab Manager Deployment Script
# This script helps deploy the application using Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="production"
COMPOSE_FILE="compose.yaml"
ENV_FILE=".env"
PROFILES=""

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS] COMMAND"
    echo ""
    echo "Commands:"
    echo "  deploy    Deploy the application"
    echo "  update    Update the application to latest version"
    echo "  stop      Stop the application"
    echo "  restart   Restart the application"
    echo "  logs      Show application logs"
    echo "  cleanup   Remove unused images and containers"
    echo ""
    echo "Options:"
    echo "  -e, --env ENV_FILE     Environment file (default: .env)"
    echo "  -f, --file COMPOSE     Docker compose file (default: compose.yaml)"
    echo "  -p, --profile PROFILE  Docker compose profile (storage, cache, tools)"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy                          # Deploy with default settings"
    echo "  $0 deploy -p storage,cache,tools   # Deploy with MinIO, Redis and pgAdmin"
    echo "  $0 update                          # Update to latest version"
    echo "  $0 logs -f                         # Follow logs"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENV_FILE="$2"
            shift 2
            ;;
        -f|--file)
            COMPOSE_FILE="$2"
            shift 2
            ;;
        -p|--profile)
            PROFILES="--profile $2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        deploy|update|stop|restart|logs|cleanup)
            COMMAND="$1"
            shift
            break
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Check if command is provided
if [ -z "$COMMAND" ]; then
    print_error "No command provided"
    show_usage
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available"
    exit 1
fi

# Check if environment file exists
if [ ! -f "$ENV_FILE" ] && [ "$COMMAND" != "cleanup" ]; then
    print_warning "Environment file $ENV_FILE not found"
    if [ -f ".env.example" ]; then
        print_status "Creating $ENV_FILE from template..."
        cp .env.example "$ENV_FILE"
        print_warning "Please edit $ENV_FILE with your actual values before deploying"
        exit 1
    fi
fi

# Execute commands
case $COMMAND in
    deploy)
        print_status "Deploying CoLab Manager..."
        
        # Pull latest images
        print_status "Pulling latest images..."
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" $PROFILES pull
        
        # Run database migrations
        print_status "Running database migrations..."
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" $PROFILES run --rm app bunx prisma migrate deploy
        
        # Start services
        print_status "Starting services..."
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" $PROFILES up -d
        
        print_success "CoLab Manager deployed successfully!"
        print_status "Application should be available at the configured BASE_URL"
        ;;
        
    update)
        print_status "Updating CoLab Manager..."
        
        # Pull latest images
        print_status "Pulling latest images..."
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" $PROFILES pull
        
        # Run database migrations
        print_status "Running database migrations..."
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" $PROFILES run --rm app bunx prisma migrate deploy
        
        # Restart services
        print_status "Restarting services..."
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" $PROFILES up -d
        
        print_success "CoLab Manager updated successfully!"
        ;;
        
    stop)
        print_status "Stopping CoLab Manager..."
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" $PROFILES down
        print_success "CoLab Manager stopped"
        ;;
        
    restart)
        print_status "Restarting CoLab Manager..."
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" $PROFILES restart
        print_success "CoLab Manager restarted"
        ;;
        
    logs)
        print_status "Showing logs..."
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" $PROFILES logs "$@"
        ;;
        
    cleanup)
        print_status "Cleaning up unused Docker resources..."
        docker system prune -f
        docker image prune -f
        print_success "Cleanup completed"
        ;;
        
    *)
        print_error "Unknown command: $COMMAND"
        show_usage
        exit 1
        ;;
esac
