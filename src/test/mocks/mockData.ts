/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Mock data generators for testing
 * Provides realistic Redis data for test scenarios
 */

export function mockConnectionConfig(overrides = {}) {
  return {
    id: "conn-1",
    name: "Test Connection",
    host: "localhost",
    port: 6379,
    tls: false,
    password: "",
    ...overrides,
  };
}

export function mockKeyInfo(overrides = {}) {
  return {
    key: "user:1",
    type: "string",
    ttl: -1,
    ...overrides,
  };
}

export function mockKeyInfos(count: number): any[] {
  return Array.from({ length: count }, (_, i) => ({
    key: `key:${i}`,
    type: ["string", "hash", "list", "set", "zset", "stream"][i % 6],
    ttl: i % 2 === 0 ? 3600 : -1,
  }));
}

export function mockHashData(fieldsCount: number = 3): Record<string, string> {
  const fields: Record<string, string> = {};
  for (let i = 0; i < fieldsCount; i++) {
    fields[`field${i}`] = `value${i}`;
  }
  return fields;
}

export function mockListData(length: number = 5): string[] {
  return Array.from({ length }, (_, i) => `item${i}`);
}

export function mockSetData(length: number = 4): string[] {
  return Array.from({ length }, (_, i) => `member${i}`);
}

export function mockZSetData(length: number = 4): Array<{ member: string; score: number }> {
  return Array.from({ length }, (_, i) => ({
    member: `member${i}`,
    score: i * 10,
  }));
}

export function mockRedisInfo(): string {
  return `
# Server
redis_version=7.0.0
redis_mode=standalone
os=Linux
arch_bits=64

# Clients
connected_clients=5

# Memory
used_memory_human=10.5M

# Persistence
rdb_last_save_time=1678900000

# Stats
total_commands_processed=15000
total_connections_received=100
`;
}

export function mockSearchResults(count: number = 3): Array<{ key: string; score: number }> {
  return Array.from({ length: count }, (_, i) => ({
    key: `doc:${i}`,
    score: 0.95 - i * 0.1,
  }));
}

export function mockIndexInfo(): string {
  return `
FT.indexname
idx:my-index
idx:number_of_docs:1000
idx:fields:2
field:1 name:title type:text
field:2 name:tags type:tag
`;
}

export function mockVectorSearchResults(
  topK: number = 5
): Array<{ member: string; score: number }> {
  return Array.from({ length: topK }, (_, i) => ({
    member: `vec:doc:${i}`,
    score: 0.9 - i * 0.05,
  }));
}

export function mockStreamEntries(count: number = 3): any[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${1678900000 + i}-0`,
    field: "data",
    value: `message${i}`,
  }));
}

export function mockTimeSeriesData(
  points: number = 10
): Array<{ timestamp: number; value: number }> {
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => ({
    timestamp: now - i * 1000,
    value: Math.random() * 100,
  }));
}

/**
 * Generate a large dataset for performance testing
 */
export function mockLargeKeySet(count: number = 10000): any[] {
  return Array.from({ length: count }, (_, i) => ({
    key: `large:${i}`,
    type: ["string", "hash", "list", "set"][i % 4],
    ttl: i % 5 === 0 ? 3600 : -1,
  }));
}

/**
 * Mock error responses
 */
export const mockErrors = {
  connection: {
    timeout: "Connection timeout",
    refused: "Connection refused",
    auth: "NOAUTH Authentication required",
    invalidConfig: "Invalid connection parameters",
  },
  key: {
    notFound: "Key not found",
    deleteFailed: "Failed to delete key",
    invalidPattern: "Invalid scan pattern",
  },
  type: {
    wrongType: "WRONGTYPE Operation against a key holding the wrong kind of value",
  },
  network: {
    disconnected: "Network disconnected",
    timeout: "Request timeout after 5000ms",
    malformed: "Invalid response format",
  },
};

/**
 * Performance test scenarios
 */
export const performanceTestScenarios = {
  smallDataset: { keyCount: 100, description: "Small dataset test" },
  mediumDataset: { keyCount: 1000, description: "Medium dataset test" },
  largeDataset: { keyCount: 10000, description: "Large dataset test" },
  hugeDataset: { keyCount: 100000, description: "Huge dataset test" },
};
