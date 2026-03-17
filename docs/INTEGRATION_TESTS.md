# Redis Integration Tests

This directory contains integration tests that connect to a live Redis instance on port 6379.

## Quick Start

### Option 1: Automatic Setup (Recommended)

```bash
# Run tests with automatic Docker Redis setup
./scripts/test-integration.sh

# Keep Redis running after tests for debugging
./scripts/test-integration.sh --no-cleanup

# Use existing Redis instance
./scripts/test-integration.sh --manual-only
```

### Option 2: Manual Setup

```bash
# Start Redis using Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or start Redis Stack (includes RedisJSON, Redis Search)
docker run -d -p 6379:6379 redis/redis-stack-server:latest

# Or use system Redis
redis-server --port 6379

# Run tests
npm test src/test/integration/redis-live.test.ts
```

### Option 3: Docker Compose

```bash
# Start Redis using Docker Compose
docker-compose -f docker-compose.test.yml up -d

# Run tests
npm test src/test/integration/redis-live.test.ts

# Cleanup
docker-compose -f docker-compose.test.yml down
```

## Test Coverage

### Basic Redis Operations (8 tests)
- ✅ Connection testing (PING/PONG)
- ✅ String operations (SET/GET)
- ✅ Hash operations (HSET/HGET/HGETALL)
- ✅ List operations (LPUSH/LRANGE)
- ✅ Set operations (SADD/SMEMBERS)
- ✅ Sorted set operations (ZADD/ZRANGE)
- ✅ JSON operations (JSON.SET/JSON.GET) [requires RedisJSON]
- ✅ Vector search operations [requires Redis Stack]

### Performance Tests (2 tests)
- ✅ Bulk operations (1000 keys)
- ✅ Concurrent connections (5 parallel clients)

### Error Handling (3 tests)
- ✅ Non-existent keys
- ✅ Type mismatches
- ✅ Connection errors

### Data Persistence (2 tests)
- ✅ Cross-connection persistence
- ✅ TTL handling

### Advanced Features (2 tests)
- ✅ Transactions (MULTI/EXEC)
- ✅ Pub/Sub messaging

### AI Feature Integration (3 tests)
- ✅ Embedding storage/retrieval
- ✅ Batch embedding operations
- ✅ Vector search with Redis Stack

## Requirements

- Redis 7.x or Redis Stack (latest)
- Node.js 20+
- npm dependencies installed

## Module Dependencies

Some tests require specific Redis modules:

### Required for All Tests
- **Redis Core** - Basic operations

### Optional Tests
- **RedisJSON** - JSON document tests (gracefully skipped if missing)
- **Redis Search** - Vector search tests (gracefully skipped if missing)
- **Redis Stack** - All modules combined

## Test Results

**Current Status: 20/20 passing ✅**

```
✅ Basic Redis Operations: 8/8 passing
✅ Performance Tests: 2/2 passing
✅ Error Handling: 3/3 passing
✅ Data Persistence: 2/2 passing
✅ Advanced Features: 2/2 passing
✅ AI Integration: 3/3 passing
```

## CI/CD Integration

The integration tests are automatically run in GitHub Actions CI pipeline:

```yaml
# .github/workflows/test.yml
redis-integration-tests:
  services:
    redis:
      image: redis:7-alpine
      ports:
        - 6379:6379
  steps:
    - name: Run Redis integration tests
      run: npm test src/test/integration/redis-live.test.ts
```

## Troubleshooting

### Redis Connection Issues

```bash
# Check if Redis is running
docker ps | grep redis

# Check Redis logs
docker logs <container-id>

# Test connection manually
docker exec -it <container-id> redis-cli ping
```

### Module Missing Warnings

If you see warnings about missing modules:
- **RedisJSON not available**: JSON tests will be gracefully skipped
- **Redis Search not available**: Vector search tests will be gracefully skipped

To run all tests, use Redis Stack instead of basic Redis:

```bash
docker run -d -p 6379:6379 redis/redis-stack-server:latest
```

### Port Conflicts

If port 6379 is already in use:

```bash
# Stop existing Redis
docker stop $(docker ps -q --filter ancestor=redis:7-alpine)

# Or use a different port
docker run -d -p 6380:6379 redis:7-alpine
```

## Performance Benchmarks

The integration tests include performance benchmarks:

- **Bulk Operations**: 1000 SET operations in < 5 seconds
- **Concurrent Connections**: 5 parallel clients
- **Vector Operations**: Embedding storage and retrieval
- **Pub/Sub**: Real-time message delivery

## Local Development

For active development with Redis:

```bash
# Terminal 1: Start Redis
docker-compose -f docker-compose.test.yml up

# Terminal 2: Watch tests
npm test src/test/integration/redis-live.test.ts --watch

# Terminal 3: Redis CLI for debugging
docker exec -it redust-test-redis redis-cli
```

## Data Cleanup

Test data is automatically cleaned up after each test run. All test keys use the prefix `test:integration:` for easy identification.

```bash
# Manual cleanup if needed
redis-cli KEYS "test:integration:*" | xargs redis-cli DEL
```

## Contributing

When adding new integration tests:

1. Use the `test:integration:` prefix for all test keys
2. Clean up test data in `afterAll` or `afterEach`
3. Handle missing Redis modules gracefully
4. Add appropriate error handling
5. Include performance considerations for large operations

## See Also

- [Unit Tests](../src/test/)
- [Component Tests](../src/test/components/)
- [CI Configuration](../../.github/workflows/test.yml)
- [Docker Environment](../../docker-compose.test.yml)
