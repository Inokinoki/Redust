#!/bin/bash

# Redis Integration Test Runner
# This script sets up a test Redis environment and runs integration tests

set -e

echo "🔧 Redust Integration Test Runner"
echo "================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if Redis is running
check_redis() {
    local host=$1
    local port=$2
    if redis-cli -h "$host" -p "$port" ping > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to start Docker Redis
start_docker_redis() {
    echo "🐳 Starting Redis in Docker..."

    # Check if docker-compose is available
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.test.yml up -d redis
    elif command -v docker &> /dev/null; then
        docker compose -f docker-compose.test.yml up -d redis
    else
        echo "❌ Docker not found. Please install Docker or start Redis manually."
        return 1
    fi

    # Wait for Redis to be ready
    echo "⏳ Waiting for Redis to be ready..."
    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if check_redis "localhost" "6379"; then
            echo -e "${GREEN}✅ Redis is ready!${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done

    echo -e "${RED}❌ Redis failed to start${NC}"
    return 1
}

# Function to stop Docker Redis
stop_docker_redis() {
    echo "🛑 Stopping Redis containers..."

    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.test.yml down
    elif command -v docker &> /dev/null; then
        docker compose -f docker-compose.test.yml down
    fi
}

# Function to run tests
run_tests() {
    echo "🧪 Running integration tests..."

    # Set test environment variables
    export REDIS_HOST=localhost
    export REDIS_PORT=6379
    export NODE_ENV=test

    # Run the integration tests
    npm test src/test/integration/redis-live.test.ts

    local test_exit_code=$?

    if [ $test_exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ All integration tests passed!${NC}"
    else
        echo -e "${RED}❌ Some tests failed${NC}"
    fi

    return $test_exit_code
}

# Main execution
main() {
    local mode=${1:-"auto"}
    local cleanup=${2:-"true"}

    echo "Mode: $mode"
    echo "Cleanup: $cleanup"
    echo ""

    # Check if Redis is already running
    if check_redis "localhost" "6379"; then
        echo -e "${GREEN}✅ Redis is already running on port 6379${NC}"
    else
        if [ "$mode" = "auto" ] || [ "$mode" = "docker" ]; then
            if ! start_docker_redis; then
                exit 1
            fi
        else
            echo -e "${YELLOW}⚠️ Redis not found. Please start Redis manually:${NC}"
            echo "   docker run -d -p 6379:6379 redis:alpine"
            echo "   or"
            echo "   redis-server"
            exit 1
        fi
    fi

    # Run tests
    run_tests
    local test_exit_code=$?

    # Cleanup if requested and we started Docker Redis
    if [ "$cleanup" = "true" ] && [ "$mode" = "docker" ]; then
        stop_docker_redis
    fi

    exit $test_exit_code
}

# Handle script arguments
case "${1:-}" in
    --no-cleanup)
        main "auto" "false"
        ;;
    --manual-only)
        echo "🔍 Looking for existing Redis instance..."
        if check_redis "localhost" "6379"; then
            echo -e "${GREEN}✅ Found Redis on port 6379${NC}"
            run_tests
        else
            echo -e "${RED}❌ No Redis found on port 6379${NC}"
            echo "Please start Redis manually:"
            echo "  docker run -d -p 6379:6379 redis:alpine"
            echo "  or"
            echo "  redis-server"
            exit 1
        fi
        ;;
    --help)
        echo "Redis Integration Test Runner"
        echo ""
        echo "Usage:"
        echo "  $0                    # Auto-start Docker Redis, run tests, cleanup"
        echo "  $0 --no-cleanup      # Auto-start Docker Redis, run tests, keep running"
        echo "  $0 --manual-only     # Use existing Redis, run tests"
        echo "  $0 --help            # Show this help message"
        echo ""
        echo "Examples:"
        echo "  # Quick test with automatic setup"
        echo "  $0"
        echo ""
        echo "  # Start Redis and keep it running for debugging"
        echo "  $0 --no-cleanup"
        echo ""
        echo "  # Use your own Redis instance"
        echo "  redis-server --port 6379"
        echo "  $0 --manual-only"
        ;;
    *)
        main "auto" "true"
        ;;
esac
