import { invoke } from "@tauri-apps/api/core";
import type { ConnectionConfig, KeyInfo } from "../types";

export type { ConnectionConfig, KeyInfo };

// Connection commands

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

export interface VectorFieldConfig {
  name: string;
  dimensions: number;
  algorithm: string;
  distanceMetric: string;
  initialCap?: number;
  m?: number;
  efConstruction?: number;
  efRuntime?: number;
}

export interface CreateVectorIndexRequest {
  indexName: string;
  prefix: string;
  vectorField: VectorFieldConfig;
}

export async function createVectorIndex(
  config: ConnectionConfig,
  request: CreateVectorIndexRequest
): Promise<string> {
  return await invoke("createVectorIndex", { config, request });
}

export interface VectorSearchRequestApi {
  indexName: string;
  queryVector: number[];
  vectorField: string;
  topK?: number;
  returnFields?: string[];
}

export interface VectorSearchResult {
  key: string;
  score: number;
  fields?: Record<string, string>;
}

export async function vectorSearchApi(
  config: ConnectionConfig,
  request: VectorSearchRequestApi
): Promise<VectorSearchResult[]> {
  return await invoke("vectorSearch", { config, request });
}

export async function listVectorIndexes(config: ConnectionConfig): Promise<string[]> {
  return await invoke("listVectorIndexes", { config });
}

export interface VectorIndexInfo {
  indexName: string;
  indexStatus: string;
  schemaFields: Array<{ name: string; fieldType: string; sortable: boolean }>;
  numDocs: number;
  vectorField?: string;
  vectorDimensions?: number;
}

export async function getVectorIndexInfo(
  config: ConnectionConfig,
  indexName: string
): Promise<VectorIndexInfo> {
  return await invoke("getVectorIndexInfo", { config, indexName });
}

export async function deleteVectorIndex(
  config: ConnectionConfig,
  indexName: string
): Promise<boolean> {
  return await invoke("deleteVectorIndex", { config, indexName });
}

export interface ClusterPoint {
  key: string;
  x: number;
  y: number;
  clusterId: number;
  label?: string;
}

export interface ClusterVisualization {
  points: ClusterPoint[];
  numClusters: number;
  clusterCentroids: [number, number][];
}

export async function getEmbeddingClusters(
  config: ConnectionConfig,
  indexName: string,
  vectorField: string,
  numClusters: number,
  sampleSize?: number
): Promise<ClusterVisualization> {
  return await invoke("getEmbeddingClusters", {
    config,
    indexName,
    vectorField,
    numClusters,
    sampleSize,
  });
}

export async function batchVectorSearch(
  config: ConnectionConfig,
  requests: VectorSearchRequestApi[]
): Promise<VectorSearchResult[][]> {
  return await invoke("batchVectorSearch", { config, requests });
}

// LLM types and commands

export type LLMProvider = "OpenAI" | "Anthropic" | "Ollama";

export type LLMModel =
  | "gpt-4"
  | "gpt-4-turbo"
  | "gpt-3.5-turbo"
  | "claude-3-opus"
  | "claude-3-sonnet"
  | "claude-3-haiku"
  | "llama2"
  | "mistral";

export interface LLMMessage {
  role: string;
  content: string;
}

export interface LLMRequest {
  model: LLMModel;
  messages: LLMMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  api_key?: string;
  api_endpoint?: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface RAGRequest {
  query: string;
  model: LLMModel;
  index_name: string;
  vector_field: string;
  top_k: number;
  temperature?: number;
  max_tokens?: number;
  api_key?: string;
  api_endpoint?: string;
  conversation_history?: LLMMessage[];
}

export interface RAGSource {
  key: string;
  score: number;
  snippet?: string;
}

export interface RAGResponse {
  answer: string;
  sources: RAGSource[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface EmbeddingRequest {
  text: string;
  model?: string;
  provider: LLMProvider;
  api_key?: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
}

// LLM commands
export async function llmChat(request: LLMRequest): Promise<LLMResponse> {
  return await invoke("llm_chat", { request });
}

export async function llmRAG(
  config: ConnectionConfig,
  request: RAGRequest
): Promise<RAGResponse> {
  return await invoke("llm_rag", { config, request });
}

export async function llmGenerateEmbedding(
  request: EmbeddingRequest
): Promise<EmbeddingResponse> {
  return await invoke("llm_generate_embedding", { request });
}
