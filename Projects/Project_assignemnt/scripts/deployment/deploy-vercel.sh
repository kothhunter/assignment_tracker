#!/bin/bash

# Vercel deployment script
set -e

echo "🚀 Starting Vercel deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_NAME="project-assignment"

echo -e "${YELLOW}Deploying to: ${ENVIRONMENT}${NC}"

# Validate environment
if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "preview" ]]; then
    echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
    echo "Valid environments: production, staging, preview"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Authenticate with Vercel (if not already authenticated)
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami > /dev/null 2>&1; then
    echo -e "${YELLOW}Please authenticate with Vercel:${NC}"
    vercel login
fi

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Check if required environment variables are set
echo "Checking environment variables..."
if [ "$ENVIRONMENT" = "production" ]; then
    ENV_FILE=".env.production"
else
    ENV_FILE=".env.${ENVIRONMENT}"
fi

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

# Run linting
echo "Running linting..."
npm run lint || {
    echo -e "${RED}❌ Linting failed. Aborting deployment.${NC}"
    exit 1
}

# Build the application
echo "Building application..."
npm run build || {
    echo -e "${RED}❌ Build failed. Aborting deployment.${NC}"
    exit 1
}

# Deploy based on environment
echo "🚀 Deploying to Vercel..."

if [ "$ENVIRONMENT" = "production" ]; then
    # Production deployment
    vercel --prod --confirm --token $VERCEL_TOKEN
elif [ "$ENVIRONMENT" = "staging" ]; then
    # Staging deployment with specific alias
    vercel --confirm --token $VERCEL_TOKEN --env-file=.env.staging
    vercel alias --token $VERCEL_TOKEN
else
    # Preview deployment
    vercel --confirm --token $VERCEL_TOKEN
fi

# Get deployment URL
DEPLOYMENT_URL=$(vercel ls $PROJECT_NAME --token $VERCEL_TOKEN | head -2 | tail -1 | awk '{print $2}')

echo -e "${GREEN}✅ Deployment successful!${NC}"
echo -e "${GREEN}🌐 URL: https://$DEPLOYMENT_URL${NC}"

# Run post-deployment health check
echo "🩺 Running health check..."
sleep 10 # Wait for deployment to be ready

HEALTH_CHECK_URL="https://$DEPLOYMENT_URL/api/health"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL")

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed (HTTP $HTTP_STATUS)${NC}"
    echo "Check the deployment at: https://$DEPLOYMENT_URL"
    exit 1
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Application: https://$DEPLOYMENT_URL${NC}"
echo -e "${GREEN}📊 Admin Panel: https://$DEPLOYMENT_URL/admin/monitoring${NC}"