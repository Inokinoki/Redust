import { describe, it, expect, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import {
  testConnection,
  getKeys,
  getString,
  setString,
  type ConnectionConfig,
} from "../../lib/api";

// Mock the Tauri invoke function
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("API Functions", () => {
  const mockConfig: ConnectionConfig = {
    id: "1",
    name: "Test Connection",
    host: "localhost",
    port: 6379,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Connection API", () => {
    it("should call testConnection with correct params", async () => {
      (invoke as any).mockResolvedValue("7.0.0");

      const result = await testConnection(mockConfig);

      expect(invoke).toHaveBeenCalledWith("test_connection", { config: mockConfig });
      expect(result).toBe("7.0.0");
    });

    it("should call getKeys with pattern", async () => {
      const mockKeys = [
        { key: "user:1", type: "hash", ttl: -1 },
        { key: "cache:1", type: "string", ttl: 3600 },
      ];

      (invoke as any).mockResolvedValue(mockKeys);

      const result = await getKeys(mockConfig, "user:*", 100);

      expect(invoke).toHaveBeenCalledWith("get_keys", {
        config: mockConfig,
        pattern: "user:*",
        count: 100,
      });
      expect(result).toEqual(mockKeys);
    });
  });

  describe("String API", () => {
    it("should call setString with correct params", async () => {
      (invoke as any).mockResolvedValue(true);

      const result = await setString(mockConfig, "test-key", "test-value", 3600);

      expect(invoke).toHaveBeenCalledWith("set_string", {
        config: mockConfig,
        key: "test-key",
        value: "test-value",
        ttl: 3600,
      });
      expect(result).toBe(true);
    });

    it("should call getString with correct params", async () => {
      (invoke as any).mockResolvedValue("test-value");

      const result = await getString(mockConfig, "test-key");

      expect(invoke).toHaveBeenCalledWith("get_string", {
        config: mockConfig,
        key: "test-key",
      });
      expect(result).toBe("test-value");
    });
  });
});
