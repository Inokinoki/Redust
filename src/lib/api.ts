import { invoke } from "@tauri-apps/api/core";
import type { ConnectionConfig, KeyInfo } from "../types";

// Connection commands
export async function testConnection(config: ConnectionConfig): Promise<string> {
  return await invoke("test_connection", { config });
}

export async function getRedisInfo(config: ConnectionConfig): Promise<string> {
  return await invoke("get_redis_info", { config });
}

// Key commands
export async function getKeys(
  config: ConnectionConfig,
  pattern?: string,
  count?: number
): Promise<KeyInfo[]> {
  return await invoke("get_keys", { config, pattern, count });
}

export async function getKey(config: ConnectionConfig, key: string): Promise<KeyInfo> {
  return await invoke("get_key", { config, key });
}

export async function deleteKey(config: ConnectionConfig, key: string): Promise<boolean> {
  return await invoke("delete_key", { config, key });
}

// String commands
export async function getString(config: ConnectionConfig, key: string): Promise<string | null> {
  return await invoke("get_string", { config, key });
}

export async function setString(
  config: ConnectionConfig,
  key: string,
  value: string,
  ttl?: number
): Promise<boolean> {
  return await invoke("set_string", { config, key, value, ttl });
}

// Hash commands
export async function hashGet(
  config: ConnectionConfig,
  key: string,
  field: string
): Promise<string | null> {
  return await invoke("hash_get", { config, key, field });
}

export async function hashGetAll(
  config: ConnectionConfig,
  key: string
): Promise<Record<string, string>> {
  return await invoke("hash_get_all", { config, key });
}

export async function hashSet(
  config: ConnectionConfig,
  key: string,
  field: string,
  value: string
): Promise<boolean> {
  return await invoke("hash_set", { config, key, field, value });
}

export async function hashDelete(
  config: ConnectionConfig,
  key: string,
  field: string
): Promise<boolean> {
  return await invoke("hash_delete", { config, key, field });
}

export async function hashExists(
  config: ConnectionConfig,
  key: string,
  field: string
): Promise<boolean> {
  return await invoke("hash_exists", { config, key, field });
}

export async function hashLen(config: ConnectionConfig, key: string): Promise<number> {
  return await invoke("hash_len", { config, key });
}

export async function hashKeys(config: ConnectionConfig, key: string): Promise<string[]> {
  return await invoke("hash_keys", { config, key });
}

export async function hashValues(config: ConnectionConfig, key: string): Promise<string[]> {
  return await invoke("hash_values", { config, key });
}

// List commands
export async function listLen(config: ConnectionConfig, key: string): Promise<number> {
  return await invoke("list_len", { config, key });
}

export async function listRange(
  config: ConnectionConfig,
  key: string,
  start: number,
  stop: number
): Promise<string[]> {
  return await invoke("list_range", { config, key, start, stop });
}

export async function listPush(
  config: ConnectionConfig,
  key: string,
  values: string[],
  left: boolean
): Promise<number> {
  return await invoke("list_push", { config, key, values, left });
}

export async function listPop(
  config: ConnectionConfig,
  key: string,
  left: boolean
): Promise<string | null> {
  return await invoke("list_pop", { config, key, left });
}

export async function listIndex(
  config: ConnectionConfig,
  key: string,
  index: number
): Promise<string | null> {
  return await invoke("list_index", { config, key, index });
}

export async function listRemove(
  config: ConnectionConfig,
  key: string,
  count: number,
  value: string
): Promise<number> {
  return await invoke("list_remove", { config, key, count, value });
}

export async function listTrim(
  config: ConnectionConfig,
  key: string,
  start: number,
  stop: number
): Promise<boolean> {
  return await invoke("list_trim", { config, key, start, stop });
}

// Set commands
export async function setAdd(
  config: ConnectionConfig,
  key: string,
  members: string[]
): Promise<number> {
  return await invoke("set_add", { config, key, members });
}

export async function setMembers(config: ConnectionConfig, key: string): Promise<string[]> {
  return await invoke("set_members", { config, key });
}

export async function setRemove(
  config: ConnectionConfig,
  key: string,
  members: string[]
): Promise<number> {
  return await invoke("set_remove", { config, key, members });
}

export async function setCard(config: ConnectionConfig, key: string): Promise<number> {
  return await invoke("set_card", { config, key });
}

export async function setIsMember(
  config: ConnectionConfig,
  key: string,
  member: string
): Promise<boolean> {
  return await invoke("set_is_member", { config, key, member });
}

export async function setPop(config: ConnectionConfig, key: string): Promise<string | null> {
  return await invoke("set_pop", { config, key });
}

export async function setRandomMember(
  config: ConnectionConfig,
  key: string
): Promise<string | null> {
  return await invoke("set_random_member", { config, key });
}

// Sorted Set commands
export interface SortedSetMember {
  member: string;
  score: number;
}

export async function zsetAdd(
  config: ConnectionConfig,
  key: string,
  members: SortedSetMember[]
): Promise<number> {
  return await invoke("zset_add", { config, key, members });
}

export async function zsetRange(
  config: ConnectionConfig,
  key: string,
  start: number,
  stop: number,
  withScores: boolean
): Promise<SortedSetMember[]> {
  return await invoke("zset_range", { config, key, start, stop, withScores });
}

export async function zsetRangeByScore(
  config: ConnectionConfig,
  key: string,
  min: number,
  max: number,
  withScores: boolean
): Promise<SortedSetMember[]> {
  return await invoke("zset_range_by_score", { config, key, min, max, withScores });
}

export async function zsetRem(
  config: ConnectionConfig,
  key: string,
  members: string[]
): Promise<number> {
  return await invoke("zset_rem", { config, key, members });
}

export async function zsetCard(config: ConnectionConfig, key: string): Promise<number> {
  return await invoke("zset_card", { config, key });
}

export async function zsetScore(
  config: ConnectionConfig,
  key: string,
  member: string
): Promise<number | null> {
  return await invoke("zset_score", { config, key, member });
}

export async function zsetRank(
  config: ConnectionConfig,
  key: string,
  member: string,
  reverse: boolean
): Promise<number | null> {
  return await invoke("zset_rank", { config, key, member, reverse });
}

export async function zsetCount(
  config: ConnectionConfig,
  key: string,
  min: number,
  max: number
): Promise<number> {
  return await invoke("zset_count", { config, key, min, max });
}

export async function zsetRemRangeByScore(
  config: ConnectionConfig,
  key: string,
  min: number,
  max: number
): Promise<number> {
  return await invoke("zset_rem_range_by_score", { config, key, min, max });
}

// Search and Vector commands
export interface SearchIndexField {
  name: string;
  fieldType: string;
  sortable: boolean;
}

export async function createIndex(
  config: ConnectionConfig,
  request: {
    indexName: string;
    prefix: string;
    fields: SearchIndexField[];
  }
): Promise<string> {
  return await invoke("create_index", { config, request });
}

export async function searchIndex(
  config: ConnectionConfig,
  indexName: string,
  query: string,
  limit?: number
): Promise<Array<{ key: string; score: number }>> {
  return await invoke("search_index", { config, indexName, query, limit });
}

export async function dropIndex(config: ConnectionConfig, indexName: string): Promise<boolean> {
  return await invoke("drop_index", { config, indexName });
}

export async function getIndexInfo(config: ConnectionConfig, indexName: string): Promise<string> {
  return await invoke("get_index_info", { config, indexName });
}

export interface VectorSearchRequest {
  key: string;
  queryVector: number[];
  topK: number;
}

export async function vectorSearch(
  config: ConnectionConfig,
  request: VectorSearchRequest
): Promise<Array<{ member: string; score: number }>> {
  return await invoke("vector_search", { config, request });
}

export interface EmbeddingCacheItem {
  key: string;
  text: string;
  embedding: number[];
  metadata?: string;
}

export async function uploadEmbeddings(
  config: ConnectionConfig,
  request: {
    indexName: string;
    embeddings: EmbeddingCacheItem[];
  }
): Promise<number> {
  return await invoke("upload_embeddings", { config, request });
}

export async function getCachedEmbedding(
  config: ConnectionConfig,
  key: string
): Promise<{
  text: string;
  embedding: number[];
} | null> {
  return await invoke("get_cached_embedding", { config, key });
}
