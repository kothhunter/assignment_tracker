#!/bin/bash

# Health check script for deployments
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
URL=${1:-"http://localhost:3000"}
TIMEOUT=${2:-30}
RETRIES=${3:-5}

echo -e "${BLUE}🩺 Starting health check for: $URL${NC}"

# Function to check endpoint
check_endpoint() {
    local endpoint=$1
    local expected_status=${2:-200}
    local description=$3
    
    echo -n "Checking $description... "
    
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$URL$endpoint" --max-time "$TIMEOUT" || echo "000")
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ OK ($status_code)${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED ($status_code)${NC}"
        return 1
    fi
}

# Function to check endpoint with JSON response
check_json_endpoint() {
    local endpoint=$1
    local description=$2
    
    echo -n "Checking $description... "
    
    local response=$(curl -s "$URL$endpoint" --max-time "$TIMEOUT" || echo "")
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$URL$endpoint" --max-time "$TIMEOUT" || echo "000")
    
    if [ "$status_code" = "200" ] && echo "$response" | jq . > /dev/null 2>&1; then
        local status=$(echo "$response" | jq -r '.status // "unknown"')
        if [ "$status" = "healthy" ]; then
            echo -e "${GREEN}✅ OK (healthy)${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  DEGRADED ($status)${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ FAILED ($status_code)${NC}"
        return 1
    fi
}

# Retry logic for health checks
retry_check() {
    local check_function=$1
    local endpoint=$2
    local description=$3
    local max_retries=$RETRIES
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if $check_function "$endpoint" "$description"; then
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $max_retries ]; then
            echo -e "${YELLOW}Retrying in 5 seconds... (attempt $retry_count/$max_retries)${NC}"
            sleep 5
        fi
    done
    
    return 1
}

# Start health checks
echo -e "${BLUE}Starting comprehensive health checks...${NC}"

FAILED_CHECKS=0

# Basic connectivity
if ! retry_check check_endpoint "/" 200 "Basic connectivity"; then
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# Health endpoint
if ! retry_check check_json_endpoint "/api/health" "Health endpoint"; then
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# Detailed health endpoint
if ! retry_check check_json_endpoint "/api/health/detailed" "Detailed health endpoint"; then
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# API routes
if ! retry_check check_endpoint "/api/trpc/user.getCurrentUser" 401 "tRPC API (expected 401)"; then
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# Static assets
if ! retry_check check_endpoint "/favicon.ico" 200 "Static assets"; then
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# Performance check
echo -n "Measuring response time... "
RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" "$URL/api/health" --max-time "$TIMEOUT" || echo "timeout")

if [ "$RESPONSE_TIME" != "timeout" ]; then
    RESPONSE_MS=$(echo "$RESPONSE_TIME * 1000" | bc | cut -d. -f1)
    if [ "$RESPONSE_MS" -lt 1000 ]; then
        echo -e "${GREEN}✅ ${RESPONSE_MS}ms${NC}"
    elif [ "$RESPONSE_MS" -lt 3000 ]; then
        echo -e "${YELLOW}⚠️  ${RESPONSE_MS}ms (slow)${NC}"
    else
        echo -e "${RED}❌ ${RESPONSE_MS}ms (very slow)${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
else
    echo -e "${RED}❌ Timeout${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# SSL check (if HTTPS)
if [[ "$URL" == https://* ]]; then
    echo -n "Checking SSL certificate... "
    if curl -s --fail "$URL" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Valid${NC}"
    else
        echo -e "${RED}❌ Invalid${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
fi

# Summary
echo -e "\n${BLUE}📊 Health Check Summary${NC}"
echo "=========================="

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo -e "${GREEN}🎉 Application is healthy and ready${NC}"
    exit 0
else
    echo -e "${RED}❌ $FAILED_CHECKS check(s) failed${NC}"
    echo -e "${RED}🚨 Application may have issues${NC}"
    
    # Get detailed health info if available
    echo -e "\n${YELLOW}Detailed health information:${NC}"
    curl -s "$URL/api/health/detailed" | jq . 2>/dev/null || echo "Unable to retrieve detailed health info"
    
    exit 1
fi