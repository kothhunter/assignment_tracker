#!/bin/bash

# Docker deployment script
set -e

echo "🐳 Starting Docker deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
IMAGE_NAME="project-assignment"
IMAGE_TAG=${2:-latest}
REGISTRY=${REGISTRY:-"your-registry.com"}

echo -e "${YELLOW}Environment: ${ENVIRONMENT}${NC}"
echo -e "${YELLOW}Image: ${IMAGE_NAME}:${IMAGE_TAG}${NC}"

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

# Check environment file
ENV_FILE=".env.${ENVIRONMENT}"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Environment file not found: $ENV_FILE${NC}"
    exit 1
fi

# Run tests
echo "Running tests..."
npm run test:ci || {
    echo -e "${RED}❌ Tests failed. Aborting deployment.${NC}"
    exit 1
}

# Build Docker image
echo -e "${BLUE}🔨 Building Docker image...${NC}"
docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" .

# Tag for registry
if [ -n "$REGISTRY" ]; then
    FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
    docker tag "${IMAGE_NAME}:${IMAGE_TAG}" "$FULL_IMAGE_NAME"
    
    echo -e "${BLUE}📤 Pushing image to registry...${NC}"
    docker push "$FULL_IMAGE_NAME"
    
    IMAGE_TO_USE="$FULL_IMAGE_NAME"
else
    IMAGE_TO_USE="${IMAGE_NAME}:${IMAGE_TAG}"
fi

# Deploy with docker-compose
echo -e "${BLUE}🚀 Deploying with docker-compose...${NC}"

# Create environment-specific docker-compose file
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

cat > "$COMPOSE_FILE" << EOF
version: '3.8'

services:
  app:
    image: ${IMAGE_TO_USE}
    container_name: ${IMAGE_NAME}-${ENVIRONMENT}
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=${ENVIRONMENT}
      - PORT=3000
      - DEPLOYMENT_PLATFORM=docker
    env_file:
      - ${ENV_FILE}
    volumes:
      - uploads:/app/uploads
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    networks:
      - app-network

volumes:
  uploads:

networks:
  app-network:
    driver: bridge
EOF

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f "$COMPOSE_FILE" down --remove-orphans || true

# Start new deployment
echo "🚀 Starting new deployment..."
docker-compose -f "$COMPOSE_FILE" up -d

# Wait for health check
echo "🩺 Waiting for health check..."
sleep 30

# Check if container is healthy
HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' "${IMAGE_NAME}-${ENVIRONMENT}" 2>/dev/null || echo "unknown")

if [ "$HEALTH_STATUS" = "healthy" ]; then
    echo -e "${GREEN}✅ Container is healthy${NC}"
elif [ "$HEALTH_STATUS" = "starting" ]; then
    echo -e "${YELLOW}⏳ Container is still starting, checking HTTP endpoint...${NC}"
    
    # Fallback HTTP health check
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/health" || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ HTTP health check passed${NC}"
    else
        echo -e "${RED}❌ HTTP health check failed (HTTP $HTTP_STATUS)${NC}"
        echo "Container logs:"
        docker logs "${IMAGE_NAME}-${ENVIRONMENT}" --tail 50
        exit 1
    fi
else
    echo -e "${RED}❌ Container is unhealthy${NC}"
    echo "Container logs:"
    docker logs "${IMAGE_NAME}-${ENVIRONMENT}" --tail 50
    exit 1
fi

# Show running containers
echo -e "${BLUE}📋 Running containers:${NC}"
docker-compose -f "$COMPOSE_FILE" ps

echo -e "${GREEN}🎉 Docker deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Application: http://localhost:3000${NC}"
echo -e "${GREEN}📊 Admin Panel: http://localhost:3000/admin/monitoring${NC}"

# Cleanup
rm -f "$COMPOSE_FILE"