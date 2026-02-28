import { describe, it, expect, vi, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import {
  testConnection,
  getString,
  setString,
  getKeys,
  deleteKey,
  hashGet,
  hashGetAll,
  hashSet,
  listRange,
  setMembers,
  zsetRange,
} from "../lib/api";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("API Error Handling", () => {
  const mockConfig = {
    id: "1",
    name: "Test Connection",
    host: "localhost",
    port: 6379,
    tls: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Connection Errors", () => {
    it("should handle connection timeout error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockRejectedValue(new Error("Connection timeout"));

      await expect(testConnection(mockConfig)).rejects.toThrow("Connection timeout");
    });

    it("should handle connection refused error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockRejectedValue(new Error("Connection refused"));

      await expect(testConnection(mockConfig)).rejects.toThrow("Connection refused");
    });

    it("should handle authentication error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockRejectedValue(new Error("NOAUTH Authentication required"));

      await expect(testConnection(mockConfig)).rejects.toThrow("NOAUTH Authentication required");
    });

    it("should handle invalid configuration error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockRejectedValue(new Error("Invalid connection parameters"));

      await expect(testConnection(mockConfig)).rejects.toThrow("Invalid connection parameters");
    });
  });

  describe("Key Operation Errors", () => {
    it("should handle non-existent key error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockRejectedValue(new Error("Key not found"));

      await expect(getKeys(mockConfig, "*")).rejects.toThrow("Key not found");
    });

    it("should handle delete key error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockRejectedValue(new Error("Failed to delete key"));

      await expect(deleteKey(mockConfig, "test-key")).rejects.toThrow("Failed to delete key");
    });

    it("should handle pattern scan error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockRejectedValue(new Error("Invalid scan pattern"));

      await expect(getKeys(mockConfig, "[invalid")).rejects.toThrow("Invalid scan pattern");
    });
  });

  describe("String Operation Errors", () => {
    it("should handle get string error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockRejectedValue(new Error("Failed to get string value"));

      await expect(getString(mockConfig, "test-key")).rejects.toThrow("Failed to get string value");
    });

    it("should handle set string error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockRejectedValue(new Error("Failed to set string value"));

      await expect(setString(mockConfig, "test-key", "value")).rejects.toThrow(
        "Failed to set string value"
      );
    });

    it("should handle empty key error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockRejectedValue(new Error("Key cannot be empty"));

      await expect(setString(mockConfig, "", "value")).rejects.toThrow("Key cannot be empty");
    });
  });

  describe("Hash Operation Errors", () => {
    it("should handle hash get error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockRejectedValue(new Error("Failed to get hash field"));

      await expect(hashGet(mockConfig, "hash-key", "field")).rejects.toThrow(
        "Failed to get hash field"
      );
    });

    it("should handle hash get all error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockRejectedValue(new Error("Failed to get all hash fields"));

      await expect(hashGetAll(mockConfig, "hash-key")).rejects.toThrow(
        "Failed to get all hash fields"
      );
    });

    it("should handle hash set error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockRejectedValue(new Error("Failed to set hash field"));

      await expect(hashSet(mockConfig, "hash-key", "field", "value")).rejects.toThrow(
        "Failed to set hash field"
      );
    });

    it("should handle invalid field name error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockRejectedValue(new Error("Field name cannot be empty"));

      await expect(hashSet(mockConfig, "hash-key", "", "value")).rejects.toThrow(
        "Field name cannot be empty"
      );
    });
  });

  describe("List Operation Errors", () => {
    it("should handle list range error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockRejectedValue(new Error("Failed to get list range"));

      await expect(listRange(mockConfig, "list-key", 0, -1)).rejects.toThrow(
        "Failed to get list range"
      );
    });

    it("should handle invalid range error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockRejectedValue(new Error("Invalid range indices"));

      await expect(listRange(mockConfig, "list-key", -10, 20)).rejects.toThrow(
        "Invalid range indices"
      );
    });
  });

  describe("Set Operation Errors", () => {
    it("should handle get set members error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockRejectedValue(new Error("Failed to get set members"));

      await expect(setMembers(mockConfig, "set-key")).rejects.toThrow("Failed to get set members");
    });

    it("should handle non-set type error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockRejectedValue(
        new Error("WRONGTYPE Operation against a key holding the wrong kind of value")
      );

      await expect(setMembers(mockConfig, "string-key")).rejects.toThrow("WRONGTYPE");
    });
  });

  describe("Sorted Set Operation Errors", () => {
    it("should handle sorted set range error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockRejectedValue(new Error("Failed to get sorted set range"));

      await expect(zsetRange(mockConfig, "zset-key", 0, -1, true)).rejects.toThrow(
        "Failed to get sorted set range"
      );
    });

    it("should handle invalid score error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockRejectedValue(new Error("Invalid score format"));

      await expect(zsetRange(mockConfig, "zset-key", 0, -1, true)).rejects.toThrow(
        "Invalid score format"
      );
    });
  });

  describe("Network Error States", () => {
    it("should handle network disconnection", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockRejectedValue(new Error("Network disconnected"));

      await expect(getString(mockConfig, "test-key")).rejects.toThrow("Network disconnected");
    });

    it("should handle timeout errors", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockRejectedValue(new Error("Request timeout after 5000ms"));

      await expect(getKeys(mockConfig, "*")).rejects.toThrow("Request timeout");
    });

    it("should handle malformed response", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockRejectedValue(new Error("Invalid response format"));

      await expect(hashGetAll(mockConfig, "hash-key")).rejects.toThrow("Invalid response format");
    });
  });

  describe("Validation Errors", () => {
    it("should handle null config error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockRejectedValue(new Error("Config cannot be null"));

      await expect(testConnection(null as any)).rejects.toThrow("Config cannot be null");
    });

    it("should handle missing required parameters", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockRejectedValue(new Error("Missing required parameter: key"));

      await expect(getString(mockConfig as any, "" as any)).rejects.toThrow(
        "Missing required parameter"
      );
    });
  });
});
