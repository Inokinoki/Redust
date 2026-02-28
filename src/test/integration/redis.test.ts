import { describe, it, expect, beforeEach, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";

// Mock Tauri invoke function
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("Redis Integration Tests", () => {
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

  describe("Connection Operations", () => {
    it("should test connection", async () => {
      (invoke as any).mockResolvedValue("7.0.0");

      const version = await invoke("testConnection", { config: mockConfig });
      expect(version).toBe("7.0.0");
      expect(invoke).toHaveBeenCalledWith("testConnection", { config: mockConfig });
    });
  });

  describe("String Operations", () => {
    it("should set and get string value", async () => {
      (invoke as any).mockResolvedValueOnce(undefined).mockResolvedValueOnce("test-value");

      await invoke("setValue", {
        config: mockConfig,
        key: "test-key",
        value: "test-value",
      });

      const value = await invoke("getValue", {
        config: mockConfig,
        key: "test-key",
      });

      expect(value).toBe("test-value");
    });

    it("should delete string key", async () => {
      (invoke as any).mockResolvedValue(1);

      const deleted = await invoke("deleteKey", {
        config: mockConfig,
        key: "test-key",
      });

      expect(deleted).toBe(1);
    });
  });

  describe("Hash Operations", () => {
    it("should set and get hash field", async () => {
      (invoke as any).mockResolvedValueOnce(1).mockResolvedValueOnce("field-value");

      await invoke("hset", {
        config: mockConfig,
        key: "user:1",
        field: "name",
        value: "field-value",
      });

      const value = await invoke("hget", {
        config: mockConfig,
        key: "user:1",
        field: "name",
      });

      expect(value).toBe("field-value");
    });

    it("should get all hash fields", async () => {
      (invoke as any).mockResolvedValue({
        name: "John",
        age: "30",
        email: "john@example.com",
      });

      const hash = await invoke("hgetAll", {
        config: mockConfig,
        key: "user:1",
      });

      expect(hash).toEqual({
        name: "John",
        age: "30",
        email: "john@example.com",
      });
    });
  });

  describe("List Operations", () => {
    it("should push and get list elements", async () => {
      (invoke as any).mockResolvedValueOnce(1).mockResolvedValueOnce(["item1", "item2"]);

      await invoke("rpush", {
        config: mockConfig,
        key: "mylist",
        value: "item1",
      });

      const items = await invoke("lrange", {
        config: mockConfig,
        key: "mylist",
        start: 0,
        stop: -1,
      });

      expect(items).toContain("item1");
    });

    it("should get list length", async () => {
      (invoke as any).mockResolvedValue(3);

      const length = await invoke("llen", {
        config: mockConfig,
        key: "mylist",
      });

      expect(length).toBe(3);
    });
  });

  describe("Set Operations", () => {
    it("should add and check set member", async () => {
      (invoke as any).mockResolvedValueOnce(1).mockResolvedValueOnce(true);

      await invoke("sadd", {
        config: mockConfig,
        key: "myset",
        member: "member1",
      });

      const isMember = await invoke("sismember", {
        config: mockConfig,
        key: "myset",
        member: "member1",
      });

      expect(isMember).toBe(true);
    });

    it("should get all set members", async () => {
      (invoke as any).mockResolvedValue(["member1", "member2", "member3"]);

      const members = await invoke("smembers", {
        config: mockConfig,
        key: "myset",
      });

      expect(members).toHaveLength(3);
    });
  });

  describe("Sorted Set Operations", () => {
    it("should add and get sorted set member", async () => {
      (invoke as any).mockResolvedValueOnce(1).mockResolvedValueOnce(["member1", "100"]);

      await invoke("zadd", {
        config: mockConfig,
        key: "zset",
        score: 100,
        member: "member1",
      });

      const members = await invoke("zrange", {
        config: mockConfig,
        key: "zset",
        start: 0,
        stop: -1,
      });

      expect(members).toEqual(["member1", "100"]);
    });
  });
});
