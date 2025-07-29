#!/bin/bash

# Deployment script for Clair Telegram Bot
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
IMAGE_NAME="clair-telegram-bot"
CONTAINER_NAME="clair-telegram-bot"

echo -e "${GREEN}🚀 Starting deployment for environment: ${ENVIRONMENT}${NC}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo -e "${RED}❌ Invalid environment. Use: development, staging, or production${NC}"
    exit 1
fi

# Check if required files exist
if [ ! -f ".env.${ENVIRONMENT}" ]; then
    echo -e "${RED}❌ Environment file .env.${ENVIRONMENT} not found${NC}"
    exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ docker-compose.yml not found${NC}"
    exit 1
fi

# Load environment variables
source .env.${ENVIRONMENT}

echo -e "${YELLOW}📋 Pre-deployment checks...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

# Check if required environment variables are set
required_vars=("TELEGRAM_BOT_TOKEN" "OPENAI_API_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Required environment variable ${var} is not set${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Pre-deployment checks passed${NC}"

# Build the application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build

# Build Docker image
echo -e "${YELLOW}🐳 Building Docker image...${NC}"
docker build -t ${IMAGE_NAME}:${ENVIRONMENT} -t ${IMAGE_NAME}:latest .

# Stop existing container if running
echo -e "${YELLOW}🛑 Stopping existing container...${NC}"
docker-compose down || true

# Start new container
echo -e "${YELLOW}🚀 Starting new container...${NC}"
if [ "$ENVIRONMENT" = "development" ]; then
    docker-compose -f docker-compose.dev.yml up -d
else
    docker-compose up -d
fi

# Wait for container to be healthy
echo -e "${YELLOW}⏳ Waiting for container to be healthy...${NC}"
timeout=60
counter=0

while [ $counter -lt $timeout ]; do
    if docker-compose ps | grep -q "healthy"; then
        echo -e "${GREEN}✅ Container is healthy${NC}"
        break
    fi
    
    if [ $counter -eq $timeout ]; then
        echo -e "${RED}❌ Container failed to become healthy within ${timeout} seconds${NC}"
        docker-compose logs
        exit 1
    fi
    
    sleep 2
    counter=$((counter + 2))
done

# Run post-deployment tests
echo -e "${YELLOW}🧪 Running post-deployment tests...${NC}"
if [ -f "scripts/health-check.sh" ]; then
    ./scripts/health-check.sh
else
    # Basic health check
    if curl -f http://localhost:${PORT:-3000}/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Health check passed${NC}"
    else
        echo -e "${RED}❌ Health check failed${NC}"
        exit 1
    fi
fi

# Show deployment status
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${YELLOW}📊 Deployment Summary:${NC}"
echo "Environment: ${ENVIRONMENT}"
echo "Image: ${IMAGE_NAME}:${ENVIRONMENT}"
echo "Container: ${CONTAINER_NAME}"
echo "Port: ${PORT:-3000}"

# Show running containers
echo -e "${YELLOW}📋 Running containers:${NC}"
docker-compose ps

echo -e "${GREEN}✅ Deployment complete! Bot is now running.${NC}"