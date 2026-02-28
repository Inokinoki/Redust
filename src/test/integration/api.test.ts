import { describe, it, expect, beforeEach, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import {
  testConnection,
  getKeys,
  getString,
  setString,
  getRedisInfo,
  getKey,
  deleteKey,
  hashGet,
  hashGetAll,
  hashSet,
  hashDelete,
  hashExists,
  hashLen,
  hashKeys,
  hashValues,
  listLen,
  listRange,
  listPush,
  listPop,
  listIndex,
  listRemove,
  listTrim,
  setAdd,
  setMembers,
  setRemove,
  setCard,
  setIsMember,
  setPop,
  setRandomMember,
  zsetAdd,
  zsetRange,
  zsetRangeByScore,
  zsetRem,
  zsetCard,
  zsetScore,
  zsetRank,
  zsetCount,
  zsetRemRangeByScore,
  createIndex,
  searchIndex,
  dropIndex,
  getIndexInfo,
  vectorSearch,
  uploadEmbeddings,
  getCachedEmbedding,
} from "../../lib/api";
import type { ConnectionConfig } from "../../lib/api";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("API Functions", () => {
  const mockConfig: ConnectionConfig = {
    id: "1",
    name: "Test Connection",
    host: "localhost",
    port: 6379,
    tls: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Connection API", () => {
    it("should call testConnection with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue("7.0.0");

      const result = await testConnection(mockConfig);

      expect(invoke).toHaveBeenCalledWith("test_connection", { config: mockConfig });
      expect(result).toBe("7.0.0");
    });

    it("should call getRedisInfo with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue("redis_version=7.0.0");

      const result = await getRedisInfo(mockConfig);

      expect(invoke).toHaveBeenCalledWith("get_redis_info", { config: mockConfig });
      expect(result).toBe("redis_version=7.0.0");
    });

    it("should call getKeys with pattern", async () => {
      const mockKeys = [
        { key: "user:1", type: "hash", ttl: -1 },
        { key: "cache:1", type: "string", ttl: 3600 },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(mockKeys);

      const result = await getKeys(mockConfig, "user:*", 100);

      expect(invoke).toHaveBeenCalledWith("get_keys", {
        config: mockConfig,
        pattern: "user:*",
        count: 100,
      });
      expect(result).toEqual(mockKeys);
    });

    it("should call getKey with correct params", async () => {
      const mockKey = { key: "user:1", type: "hash", ttl: -1 };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(mockKey);

      const result = await getKey(mockConfig, "user:1");

      expect(invoke).toHaveBeenCalledWith("get_key", {
        config: mockConfig,
        key: "user:1",
      });
      expect(result).toEqual(mockKey);
    });

    it("should call deleteKey with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(true);

      const result = await deleteKey(mockConfig, "test-key");

      expect(invoke).toHaveBeenCalledWith("delete_key", {
        config: mockConfig,
        key: "test-key",
      });
      expect(result).toBe(true);
    });
  });

  describe("String API", () => {
    it("should call setString with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    it("should call setString without ttl", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(true);

      const result = await setString(mockConfig, "test-key", "test-value");

      expect(invoke).toHaveBeenCalledWith("set_string", {
        config: mockConfig,
        key: "test-key",
        value: "test-value",
        ttl: undefined,
      });
      expect(result).toBe(true);
    });

    it("should call getString with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue("test-value");

      const result = await getString(mockConfig, "test-key");

      expect(invoke).toHaveBeenCalledWith("get_string", {
        config: mockConfig,
        key: "test-key",
      });
      expect(result).toBe("test-value");
    });

    it("should handle null return from getString", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(null);

      const result = await getString(mockConfig, "nonexistent-key");

      expect(result).toBeNull();
    });
  });

  describe("Hash API", () => {
    it("should call hashGet with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue("value1");

      const result = await hashGet(mockConfig, "hash-key", "field1");

      expect(invoke).toHaveBeenCalledWith("hash_get", {
        config: mockConfig,
        key: "hash-key",
        field: "field1",
      });
      expect(result).toBe("value1");
    });

    it("should call hashGetAll with correct params", async () => {
      const mockHash = { field1: "value1", field2: "value2" };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(mockHash);

      const result = await hashGetAll(mockConfig, "hash-key");

      expect(invoke).toHaveBeenCalledWith("hash_get_all", {
        config: mockConfig,
        key: "hash-key",
      });
      expect(result).toEqual(mockHash);
    });

    it("should call hashSet with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(true);

      const result = await hashSet(mockConfig, "hash-key", "field1", "value1");

      expect(invoke).toHaveBeenCalledWith("hash_set", {
        config: mockConfig,
        key: "hash-key",
        field: "field1",
        value: "value1",
      });
      expect(result).toBe(true);
    });

    it("should call hashDelete with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(true);

      const result = await hashDelete(mockConfig, "hash-key", "field1");

      expect(invoke).toHaveBeenCalledWith("hash_delete", {
        config: mockConfig,
        key: "hash-key",
        field: "field1",
      });
      expect(result).toBe(true);
    });

    it("should call hashExists with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(true);

      const result = await hashExists(mockConfig, "hash-key", "field1");

      expect(invoke).toHaveBeenCalledWith("hash_exists", {
        config: mockConfig,
        key: "hash-key",
        field: "field1",
      });
      expect(result).toBe(true);
    });

    it("should call hashLen with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(5);

      const result = await hashLen(mockConfig, "hash-key");

      expect(invoke).toHaveBeenCalledWith("hash_len", {
        config: mockConfig,
        key: "hash-key",
      });
      expect(result).toBe(5);
    });

    it("should call hashKeys with correct params", async () => {
      const mockKeys = ["field1", "field2", "field3"];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(mockKeys);

      const result = await hashKeys(mockConfig, "hash-key");

      expect(invoke).toHaveBeenCalledWith("hash_keys", {
        config: mockConfig,
        key: "hash-key",
      });
      expect(result).toEqual(mockKeys);
    });

    it("should call hashValues with correct params", async () => {
      const mockValues = ["value1", "value2", "value3"];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(mockValues);

      const result = await hashValues(mockConfig, "hash-key");

      expect(invoke).toHaveBeenCalledWith("hash_values", {
        config: mockConfig,
        key: "hash-key",
      });
      expect(result).toEqual(mockValues);
    });
  });

  describe("List API", () => {
    it("should call listLen with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(10);

      const result = await listLen(mockConfig, "list-key");

      expect(invoke).toHaveBeenCalledWith("list_len", {
        config: mockConfig,
        key: "list-key",
      });
      expect(result).toBe(10);
    });

    it("should call listRange with correct params", async () => {
      const mockValues = ["item1", "item2", "item3"];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(mockValues);

      const result = await listRange(mockConfig, "list-key", 0, -1);

      expect(invoke).toHaveBeenCalledWith("list_range", {
        config: mockConfig,
        key: "list-key",
        start: 0,
        stop: -1,
      });
      expect(result).toEqual(mockValues);
    });

    it("should call listPush with correct params (left push)", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(5);

      const result = await listPush(mockConfig, "list-key", ["item1", "item2"], true);

      expect(invoke).toHaveBeenCalledWith("list_push", {
        config: mockConfig,
        key: "list-key",
        values: ["item1", "item2"],
        left: true,
      });
      expect(result).toBe(5);
    });

    it("should call listPush with correct params (right push)", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(5);

      const result = await listPush(mockConfig, "list-key", ["item1", "item2"], false);

      expect(invoke).toHaveBeenCalledWith("list_push", {
        config: mockConfig,
        key: "list-key",
        values: ["item1", "item2"],
        left: false,
      });
      expect(result).toBe(5);
    });

    it("should call listPop with correct params (left pop)", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue("item1");

      const result = await listPop(mockConfig, "list-key", true);

      expect(invoke).toHaveBeenCalledWith("list_pop", {
        config: mockConfig,
        key: "list-key",
        left: true,
      });
      expect(result).toBe("item1");
    });

    it("should call listPop with correct params (right pop)", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue("item5");

      const result = await listPop(mockConfig, "list-key", false);

      expect(invoke).toHaveBeenCalledWith("list_pop", {
        config: mockConfig,
        key: "list-key",
        left: false,
      });
      expect(result).toBe("item5");
    });

    it("should call listIndex with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue("item3");

      const result = await listIndex(mockConfig, "list-key", 2);

      expect(invoke).toHaveBeenCalledWith("list_index", {
        config: mockConfig,
        key: "list-key",
        index: 2,
      });
      expect(result).toBe("item3");
    });

    it("should call listRemove with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(2);

      const result = await listRemove(mockConfig, "list-key", 2, "item1");

      expect(invoke).toHaveBeenCalledWith("list_remove", {
        config: mockConfig,
        key: "list-key",
        count: 2,
        value: "item1",
      });
      expect(result).toBe(2);
    });

    it("should call listTrim with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(true);

      const result = await listTrim(mockConfig, "list-key", 0, 10);

      expect(invoke).toHaveBeenCalledWith("list_trim", {
        config: mockConfig,
        key: "list-key",
        start: 0,
        stop: 10,
      });
      expect(result).toBe(true);
    });
  });

  describe("Set API", () => {
    it("should call setAdd with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(3);

      const result = await setAdd(mockConfig, "set-key", ["member1", "member2", "member3"]);

      expect(invoke).toHaveBeenCalledWith("set_add", {
        config: mockConfig,
        key: "set-key",
        members: ["member1", "member2", "member3"],
      });
      expect(result).toBe(3);
    });

    it("should call setMembers with correct params", async () => {
      const mockMembers = ["member1", "member2", "member3"];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(mockMembers);

      const result = await setMembers(mockConfig, "set-key");

      expect(invoke).toHaveBeenCalledWith("set_members", {
        config: mockConfig,
        key: "set-key",
      });
      expect(result).toEqual(mockMembers);
    });

    it("should call setRemove with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(2);

      const result = await setRemove(mockConfig, "set-key", ["member1", "member2"]);

      expect(invoke).toHaveBeenCalledWith("set_remove", {
        config: mockConfig,
        key: "set-key",
        members: ["member1", "member2"],
      });
      expect(result).toBe(2);
    });

    it("should call setCard with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(5);

      const result = await setCard(mockConfig, "set-key");

      expect(invoke).toHaveBeenCalledWith("set_card", {
        config: mockConfig,
        key: "set-key",
      });
      expect(result).toBe(5);
    });

    it("should call setIsMember with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(true);

      const result = await setIsMember(mockConfig, "set-key", "member1");

      expect(invoke).toHaveBeenCalledWith("set_is_member", {
        config: mockConfig,
        key: "set-key",
        member: "member1",
      });
      expect(result).toBe(true);
    });

    it("should call setPop with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue("member1");

      const result = await setPop(mockConfig, "set-key");

      expect(invoke).toHaveBeenCalledWith("set_pop", {
        config: mockConfig,
        key: "set-key",
      });
      expect(result).toBe("member1");
    });

    it("should call setRandomMember with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue("member2");

      const result = await setRandomMember(mockConfig, "set-key");

      expect(invoke).toHaveBeenCalledWith("set_random_member", {
        config: mockConfig,
        key: "set-key",
      });
      expect(result).toBe("member2");
    });
  });

  describe("Sorted Set API", () => {
    it("should call zsetAdd with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(2);

      const members = [
        { member: "member1", score: 1 },
        { member: "member2", score: 2 },
      ];

      const result = await zsetAdd(mockConfig, "zset-key", members);

      expect(invoke).toHaveBeenCalledWith("zset_add", {
        config: mockConfig,
        key: "zset-key",
        members,
      });
      expect(result).toBe(2);
    });

    it("should call zsetRange with correct params (with scores)", async () => {
      const mockMembers = [
        { member: "member1", score: 1 },
        { member: "member2", score: 2 },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(mockMembers);

      const result = await zsetRange(mockConfig, "zset-key", 0, -1, true);

      expect(invoke).toHaveBeenCalledWith("zset_range", {
        config: mockConfig,
        key: "zset-key",
        start: 0,
        stop: -1,
        withScores: true,
      });
      expect(result).toEqual(mockMembers);
    });

    it("should call zsetRange with correct params (without scores)", async () => {
      const mockMembers = [
        { member: "member1", score: 1 },
        { member: "member2", score: 2 },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(mockMembers);

      const result = await zsetRange(mockConfig, "zset-key", 0, -1, false);

      expect(invoke).toHaveBeenCalledWith("zset_range", {
        config: mockConfig,
        key: "zset-key",
        start: 0,
        stop: -1,
        withScores: false,
      });
      expect(result).toEqual(mockMembers);
    });

    it("should call zsetRangeByScore with correct params", async () => {
      const mockMembers = [
        { member: "member1", score: 1.5 },
        { member: "member2", score: 2 },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(mockMembers);

      const result = await zsetRangeByScore(mockConfig, "zset-key", 1, 2, true);

      expect(invoke).toHaveBeenCalledWith("zset_range_by_score", {
        config: mockConfig,
        key: "zset-key",
        min: 1,
        max: 2,
        withScores: true,
      });
      expect(result).toEqual(mockMembers);
    });

    it("should call zsetRem with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(2);

      const result = await zsetRem(mockConfig, "zset-key", ["member1", "member2"]);

      expect(invoke).toHaveBeenCalledWith("zset_rem", {
        config: mockConfig,
        key: "zset-key",
        members: ["member1", "member2"],
      });
      expect(result).toBe(2);
    });

    it("should call zsetCard with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(5);

      const result = await zsetCard(mockConfig, "zset-key");

      expect(invoke).toHaveBeenCalledWith("zset_card", {
        config: mockConfig,
        key: "zset-key",
      });
      expect(result).toBe(5);
    });

    it("should call zsetScore with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(3.5);

      const result = await zsetScore(mockConfig, "zset-key", "member1");

      expect(invoke).toHaveBeenCalledWith("zset_score", {
        config: mockConfig,
        key: "zset-key",
        member: "member1",
      });
      expect(result).toBe(3.5);
    });

    it("should call zsetRank with correct params (forward)", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(2);

      const result = await zsetRank(mockConfig, "zset-key", "member1", false);

      expect(invoke).toHaveBeenCalledWith("zset_rank", {
        config: mockConfig,
        key: "zset-key",
        member: "member1",
        reverse: false,
      });
      expect(result).toBe(2);
    });

    it("should call zsetRank with correct params (reverse)", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(2);

      const result = await zsetRank(mockConfig, "zset-key", "member1", true);

      expect(invoke).toHaveBeenCalledWith("zset_rank", {
        config: mockConfig,
        key: "zset-key",
        member: "member1",
        reverse: true,
      });
      expect(result).toBe(2);
    });

    it("should call zsetCount with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(3);

      const result = await zsetCount(mockConfig, "zset-key", 1, 5);

      expect(invoke).toHaveBeenCalledWith("zset_count", {
        config: mockConfig,
        key: "zset-key",
        min: 1,
        max: 5,
      });
      expect(result).toBe(3);
    });

    it("should call zsetRemRangeByScore with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(2);

      const result = await zsetRemRangeByScore(mockConfig, "zset-key", 1, 3);

      expect(invoke).toHaveBeenCalledWith("zset_rem_range_by_score", {
        config: mockConfig,
        key: "zset-key",
        min: 1,
        max: 3,
      });
      expect(result).toBe(2);
    });
  });

  describe("Search and Vector API", () => {
    it("should call createIndex with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue("OK");

      const request = {
        indexName: "test-index",
        prefix: "doc:",
        fields: [
          { name: "title", fieldType: "TEXT", sortable: true },
          { name: "tags", fieldType: "TAG", sortable: false },
        ],
      };

      const result = await createIndex(mockConfig, request);

      expect(invoke).toHaveBeenCalledWith("create_index", {
        config: mockConfig,
        request,
      });
      expect(result).toBe("OK");
    });

    it("should call searchIndex with correct params", async () => {
      const mockResults = [
        { key: "doc:1", score: 0.95 },
        { key: "doc:2", score: 0.85 },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(mockResults);

      const result = await searchIndex(mockConfig, "test-index", "search query", 10);

      expect(invoke).toHaveBeenCalledWith("search_index", {
        config: mockConfig,
        indexName: "test-index",
        query: "search query",
        limit: 10,
      });
      expect(result).toEqual(mockResults);
    });

    it("should call searchIndex without limit", async () => {
      const mockResults = [{ key: "doc:1", score: 0.95 }];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(mockResults);

      const result = await searchIndex(mockConfig, "test-index", "search query");

      expect(invoke).toHaveBeenCalledWith("search_index", {
        config: mockConfig,
        indexName: "test-index",
        query: "search query",
        limit: undefined,
      });
      expect(result).toEqual(mockResults);
    });

    it("should call dropIndex with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(true);

      const result = await dropIndex(mockConfig, "test-index");

      expect(invoke).toHaveBeenCalledWith("drop_index", {
        config: mockConfig,
        indexName: "test-index",
      });
      expect(result).toBe(true);
    });

    it("should call getIndexInfo with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue("Index info string");

      const result = await getIndexInfo(mockConfig, "test-index");

      expect(invoke).toHaveBeenCalledWith("get_index_info", {
        config: mockConfig,
        indexName: "test-index",
      });
      expect(result).toBe("Index info string");
    });

    it("should call vectorSearch with correct params", async () => {
      const mockResults = [
        { member: "doc:1", score: 0.95 },
        { member: "doc:2", score: 0.85 },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(mockResults);

      const request = {
        key: "test-key",
        queryVector: [0.1, 0.2, 0.3],
        topK: 10,
      };

      const result = await vectorSearch(mockConfig, request);

      expect(invoke).toHaveBeenCalledWith("vector_search", {
        config: mockConfig,
        request,
      });
      expect(result).toEqual(mockResults);
    });

    it("should call uploadEmbeddings with correct params", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(5);

      const request = {
        indexName: "test-index",
        embeddings: [
          { key: "doc:1", text: "text1", embedding: [0.1, 0.2, 0.3] },
          { key: "doc:2", text: "text2", embedding: [0.4, 0.5, 0.6] },
        ],
      };

      const result = await uploadEmbeddings(mockConfig, request);

      expect(invoke).toHaveBeenCalledWith("upload_embeddings", {
        config: mockConfig,
        request,
      });
      expect(result).toBe(5);
    });

    it("should call getCachedEmbedding with correct params", async () => {
      const mockEmbedding = {
        text: "sample text",
        embedding: [0.1, 0.2, 0.3],
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(mockEmbedding);

      const result = await getCachedEmbedding(mockConfig, "doc:1");

      expect(invoke).toHaveBeenCalledWith("get_cached_embedding", {
        config: mockConfig,
        key: "doc:1",
      });
      expect(result).toEqual(mockEmbedding);
    });

    it("should handle null return from getCachedEmbedding", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
(invoke as any).mockResolvedValue(null);

      const result = await getCachedEmbedding(mockConfig, "nonexistent");

      expect(result).toBeNull();
    });
  });
});
