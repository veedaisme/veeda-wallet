#!/bin/bash

# Health Check Script for Clair Telegram Bot
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
HEALTH_URL=${HEALTH_URL:-"http://localhost:3000/health"}
TIMEOUT=${TIMEOUT:-10}
MAX_RETRIES=${MAX_RETRIES:-3}

echo -e "${YELLOW}🏥 Starting health check...${NC}"

# Function to check health endpoint
check_health() {
    local attempt=$1
    echo -e "${YELLOW}Attempt ${attempt}/${MAX_RETRIES}: Checking ${HEALTH_URL}${NC}"
    
    # Make HTTP request with timeout
    response=$(curl -s -w "%{http_code}" --max-time $TIMEOUT "$HEALTH_URL" || echo "000")
    http_code="${response: -3}"
    body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Health check passed (HTTP $http_code)${NC}"
        
        # Parse JSON response if available
        if command -v jq >/dev/null 2>&1 && [ -n "$body" ]; then
            echo -e "${YELLOW}📊 Health Status:${NC}"
            echo "$body" | jq '.'
            
            # Check overall status
            status=$(echo "$body" | jq -r '.status // "unknown"')
            case $status in
                "healthy")
                    echo -e "${GREEN}🟢 System Status: HEALTHY${NC}"
                    return 0
                    ;;
                "degraded")
                    echo -e "${YELLOW}🟡 System Status: DEGRADED${NC}"
                    return 0
                    ;;
                "unhealthy")
                    echo -e "${RED}🔴 System Status: UNHEALTHY${NC}"
                    return 1
                    ;;
                *)
                    echo -e "${YELLOW}⚪ System Status: UNKNOWN${NC}"
                    return 0
                    ;;
            esac
        else
            echo -e "${GREEN}✅ Basic health check passed${NC}"
            return 0
        fi
    else
        echo -e "${RED}❌ Health check failed (HTTP $http_code)${NC}"
        if [ -n "$body" ]; then
            echo -e "${RED}Response: $body${NC}"
        fi
        return 1
    fi
}

# Function to check readiness endpoint
check_readiness() {
    local readiness_url="${HEALTH_URL%/health}/ready"
    echo -e "${YELLOW}🚀 Checking readiness: ${readiness_url}${NC}"
    
    response=$(curl -s -w "%{http_code}" --max-time $TIMEOUT "$readiness_url" || echo "000")
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Readiness check passed${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️ Readiness check failed (HTTP $http_code)${NC}"
        return 1
    fi
}

# Function to check specific service endpoints
check_services() {
    echo -e "${YELLOW}🔍 Checking service endpoints...${NC}"
    
    # Check metrics endpoint if available
    metrics_url="${HEALTH_URL%/health}/metrics"
    if curl -s --max-time 5 "$metrics_url" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Metrics endpoint accessible${NC}"
    else
        echo -e "${YELLOW}⚠️ Metrics endpoint not accessible${NC}"
    fi
    
    # Check debug endpoint in development
    if [ "${NODE_ENV:-production}" = "development" ]; then
        debug_url="${HEALTH_URL%/health}/debug"
        if curl -s --max-time 5 "$debug_url" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Debug endpoint accessible${NC}"
        else
            echo -e "${YELLOW}⚠️ Debug endpoint not accessible${NC}"
        fi
    fi
}

# Main health check loop
main() {
    local success=false
    
    for i in $(seq 1 $MAX_RETRIES); do
        if check_health $i; then
            success=true
            break
        fi
        
        if [ $i -lt $MAX_RETRIES ]; then
            echo -e "${YELLOW}⏳ Waiting 5 seconds before retry...${NC}"
            sleep 5
        fi
    done
    
    if [ "$success" = true ]; then
        # Additional checks if main health check passed
        check_readiness || true
        check_services || true
        
        echo -e "${GREEN}🎉 All health checks completed successfully!${NC}"
        exit 0
    else
        echo -e "${RED}💥 Health check failed after $MAX_RETRIES attempts${NC}"
        exit 1
    fi
}

# Handle script arguments
case "${1:-check}" in
    "check")
        main
        ;;
    "quick")
        MAX_RETRIES=1
        main
        ;;
    "wait")
        echo -e "${YELLOW}⏳ Waiting for service to become healthy...${NC}"
        MAX_RETRIES=30
        main
        ;;
    "help")
        echo "Usage: $0 [check|quick|wait|help]"
        echo "  check: Perform full health check (default)"
        echo "  quick: Single attempt health check"
        echo "  wait:  Wait for service to become healthy (up to 30 attempts)"
        echo "  help:  Show this help message"
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac