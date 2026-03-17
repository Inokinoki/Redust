use crate::commands::ConnectionConfig;
use crate::commands::zset::SortedSetMember;
use crate::commands::search::{SearchResult, SearchIndexField};
use crate::commands::streams::StreamMessage;
use crate::commands::timeseries::TimeSeriesDataPoint;
use crate::commands::vector::{
    CreateVectorIndexRequest, VectorSearchRequest, VectorSearchResult, EmbeddingCacheItem,
    VectorIndexInfo, IndexFieldInfo, ClusterVisualization, ClusterPoint,
};
use anyhow::{Context, Result};
use redis::AsyncCommands;
use redis::aio::{ConnectionManager, MultiplexedConnection};
use redis::{Client};
use std::time::Duration;

pub struct RedisManager {
    config: ConnectionConfig,
    client: Option<Client>,
}

impl RedisManager {
    pub fn new(config: ConnectionConfig) -> Self {
        Self {
            config,
            client: None,
        }
    }

    pub async fn get_client(&mut self) -> Result<Client> {
        if self.client.is_none() {
            let connection_string = format!(
                "redis://{}:{}{}",
                self.config.host,
                self.config.port,
                self.config
                    .password
                    .as_ref()
                    .map(|p| format!(":{}", p))
                    .unwrap_or_default()
            );

            let mut client = Client::open(connection_string)
                .context("Failed to create Redis client")?;

            // Configure connection settings
            // Note: ProtocolVersion configuration removed in redis-rs 0.25

            self.client = Some(client);
        }

        Ok(self.client.clone().unwrap())
    }

    pub async fn get_connection(&self) -> Result<MultiplexedConnection> {
        let client = self.client.as_ref().context("Redis client not initialized")?;
        client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get Redis connection")
    }

    pub async fn test_connection(&mut self) -> Result<String> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let info: String = redis::cmd("INFO")
            .arg("server")
            .query_async(&mut conn)
            .await
            .context("Failed to execute INFO command")?;

        // Extract Redis version from INFO
        if let Some(line) = info.lines().find(|l| l.starts_with("redis_version")) {
            Ok(line
                .split(':')
                .nth(1)
                .unwrap_or("unknown")
                .trim()
                .to_string())
        } else {
            Ok("unknown".to_string())
        }
    }

    pub async fn get_info(&mut self) -> Result<String> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let info: String = redis::cmd("INFO").query_async(&mut conn).await?;
        Ok(info)
    }

    pub async fn get_keys(&mut self, pattern: String, count: u64) -> Result<Vec<crate::commands::KeyInfo>> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        // Use SCAN for large keysets
        let mut keys: Vec<String> = Vec::new();
        let mut cursor: u64 = 0;

        loop {
            let (new_cursor, batch): (u64, Vec<String>) = redis::cmd("SCAN")
                .arg(cursor)
                .arg("MATCH")
                .arg(&pattern)
                .arg("COUNT")
                .arg(1000)
                .query_async(&mut conn)
                .await?;

            keys.extend(batch);

            cursor = new_cursor;
            if cursor == 0 || keys.len() >= count as usize {
                break;
            }
        }

        // Trim to requested count
        if keys.len() > count as usize {
            keys.truncate(count as usize);
        }

        // Get type and TTL for each key
        let mut key_infos = Vec::new();
        for key in keys {
            let key_type: String = redis::cmd("TYPE")
                .arg(&key)
                .query_async(&mut conn)
                .await?;
            let ttl: i64 = redis::cmd("TTL").arg(&key).query_async(&mut conn).await?;

            // Get size for certain types
            let size = match key_type.as_str() {
                "string" => {
                    if let Ok(len) = redis::cmd("STRLEN")
                        .arg(&key)
                        .query_async::<_, usize>(&mut conn)
                        .await
                    {
                        Some(len)
                    } else {
                        None
                    }
                }
                "hash" => {
                    if let Ok(len) = redis::cmd("HLEN")
                        .arg(&key)
                        .query_async::<_, usize>(&mut conn)
                        .await
                    {
                        Some(len)
                    } else {
                        None
                    }
                }
                "list" | "set" => {
                    if let Ok(len) = redis::cmd("LLEN")
                        .arg(&key)
                        .query_async::<_, usize>(&mut conn)
                        .await
                    {
                        Some(len)
                    } else {
                        None
                    }
                }
                _ => None,
            };

            key_infos.push(crate::commands::KeyInfo {
                key,
                r#type: key_type,
                ttl,
                size,
            });
        }

        Ok(key_infos)
    }

    pub async fn get_key_info(&mut self, key: &str) -> Result<crate::commands::KeyInfo> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let key_type: String = redis::cmd("TYPE")
            .arg(key)
            .query_async(&mut conn)
            .await?;
        let ttl: i64 = redis::cmd("TTL").arg(key).query_async(&mut conn).await?;

        Ok(crate::commands::KeyInfo {
            key: key.to_string(),
            r#type: key_type,
            ttl,
            size: None,
        })
    }

    pub async fn delete_key(&mut self, key: &str) -> Result<bool> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let deleted: i32 = redis::cmd("DEL").arg(key).query_async(&mut conn).await?;
        Ok(deleted > 0)
    }

    pub async fn get_string(&mut self, key: &str) -> Result<Option<String>> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let value: Option<String> = redis::cmd("GET").arg(key).query_async(&mut conn).await?;
        Ok(value)
    }

    pub async fn set_string(&mut self, key: &str, value: &str, ttl: Option<i64>) -> Result<bool> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        if let Some(expiry) = ttl {
            redis::cmd("SET")
                .arg(key)
                .arg(value)
                .arg("EX")
                .arg(expiry)
                .query_async(&mut conn)
                .await?;
        } else {
            redis::cmd("SET")
                .arg(key)
                .arg(value)
                .query_async(&mut conn)
                .await?;
        }

        Ok(true)
    }

    pub async fn hash_get(&mut self, key: &str, field: &str) -> Result<Option<String>> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let value: Option<String> = redis::cmd("HGET")
            .arg(key)
            .arg(field)
            .query_async(&mut conn)
            .await?;
        Ok(value)
    }

    pub async fn hash_get_all(&mut self, key: &str) -> Result<std::collections::HashMap<String, String>> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let map: std::collections::HashMap<String, String> = redis::cmd("HGETALL")
            .arg(key)
            .query_async(&mut conn)
            .await?;
        Ok(map)
    }

    pub async fn hash_set(&mut self, key: &str, field: &str, value: &str) -> Result<bool> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        redis::cmd("HSET")
            .arg(key)
            .arg(field)
            .arg(value)
            .query_async::<_, i32>(&mut conn)
            .await?;
        Ok(true)
    }

    pub async fn hash_delete(&mut self, key: &str, field: &str) -> Result<bool> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let deleted: i32 = redis::cmd("HDEL")
            .arg(key)
            .arg(field)
            .query_async(&mut conn)
            .await?;
        Ok(deleted > 0)
    }

    pub async fn hash_exists(&mut self, key: &str, field: &str) -> Result<bool> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let exists: i32 = redis::cmd("HEXISTS")
            .arg(key)
            .arg(field)
            .query_async(&mut conn)
            .await?;
        Ok(exists > 0)
    }

    pub async fn hash_len(&mut self, key: &str) -> Result<usize> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let len: usize = redis::cmd("HLEN").arg(key).query_async(&mut conn).await?;
        Ok(len)
    }

    pub async fn hash_keys(&mut self, key: &str) -> Result<Vec<String>> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let keys: Vec<String> = redis::cmd("HKEYS").arg(key).query_async(&mut conn).await?;
        Ok(keys)
    }

    pub async fn hash_values(&mut self, key: &str) -> Result<Vec<String>> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let values: Vec<String> = redis::cmd("HVALUES").arg(key).query_async(&mut conn).await?;
        Ok(values)
    }

    // List operations
    pub async fn list_len(&mut self, key: &str) -> Result<usize> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let len: usize = redis::cmd("LLEN").arg(key).query_async(&mut conn).await?;
        Ok(len)
    }

    pub async fn list_range(&mut self, key: &str, start: i64, stop: i64) -> Result<Vec<String>> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let values: Vec<String> = redis::cmd("LRANGE")
            .arg(key)
            .arg(start)
            .arg(stop)
            .query_async(&mut conn)
            .await?;
        Ok(values)
    }

    pub async fn list_push(&mut self, key: &str, values: &[String], left: bool) -> Result<usize> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let cmd = if left { "LPUSH" } else { "RPUSH" };
        let len: usize = redis::cmd(cmd)
            .arg(key)
            .arg(values)
            .query_async(&mut conn)
            .await?;
        Ok(len)
    }

    pub async fn list_pop(&mut self, key: &str, left: bool) -> Result<Option<String>> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let cmd = if left { "LPOP" } else { "RPOP" };
        let value: Option<String> = redis::cmd(cmd).arg(key).query_async(&mut conn).await?;
        Ok(value)
    }

    pub async fn list_index(&mut self, key: &str, index: i64) -> Result<Option<String>> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let value: Option<String> = redis::cmd("LINDEX")
            .arg(key)
            .arg(index)
            .query_async(&mut conn)
            .await?;
        Ok(value)
    }

    pub async fn list_remove(&mut self, key: &str, count: i64, value: &str) -> Result<i64> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let removed: i64 = redis::cmd("LREM")
            .arg(key)
            .arg(count)
            .arg(value)
            .query_async(&mut conn)
            .await?;
        Ok(removed)
    }

    pub async fn list_trim(&mut self, key: &str, start: i64, stop: i64) -> Result<bool> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        redis::cmd("LTRIM")
            .arg(key)
            .arg(start)
            .arg(stop)
            .query_async::<_, ()>(&mut conn)
            .await?;
        Ok(true)
    }

    // Set operations
    pub async fn set_add(&mut self, key: &str, members: &[String]) -> Result<usize> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let added: usize = redis::cmd("SADD")
            .arg(key)
            .arg(members)
            .query_async(&mut conn)
            .await?;
        Ok(added)
    }

    pub async fn set_members(&mut self, key: &str) -> Result<Vec<String>> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let members: Vec<String> = redis::cmd("SMEMBERS").arg(key).query_async(&mut conn).await?;
        Ok(members)
    }

    pub async fn set_remove(&mut self, key: &str, members: &[String]) -> Result<usize> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let removed: usize = redis::cmd("SREM")
            .arg(key)
            .arg(members)
            .query_async(&mut conn)
            .await?;
        Ok(removed)
    }

    pub async fn set_cardinality(&mut self, key: &str) -> Result<usize> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let cardinality: usize = redis::cmd("SCARD").arg(key).query_async(&mut conn).await?;
        Ok(cardinality)
    }

    pub async fn set_is_member(&mut self, key: &str, member: &str) -> Result<bool> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let is_member: i32 = redis::cmd("SISMEMBER")
            .arg(key)
            .arg(member)
            .query_async(&mut conn)
            .await?;
        Ok(is_member > 0)
    }

    pub async fn set_pop(&mut self, key: &str) -> Result<Option<String>> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let value: Option<String> = redis::cmd("SPOP").arg(key).query_async(&mut conn).await?;
        Ok(value)
    }

    pub async fn set_random_member(&mut self, key: &str) -> Result<Option<String>> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let value: Option<String> = redis::cmd("SRANDMEMBER").arg(key).query_async(&mut conn).await?;
        Ok(value)
    }

    // Sorted Set operations
    pub async fn zset_add(&mut self, key: &str, members: &[SortedSetMember]) -> Result<usize> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let added: usize = redis::cmd("ZADD")
            .arg(key)
            .arg(
                members
                    .iter()
                    .flat_map(|m| [m.score.to_string(), m.member.clone()])
                    .collect::<Vec<_>>()
            )
            .query_async(&mut conn)
            .await?;
        Ok(added)
    }

    pub async fn zset_range(&mut self, key: &str, start: i64, stop: i64, with_scores: bool) -> Result<Vec<SortedSetMember>> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        if with_scores {
            let result: Vec<(String, f64)> = redis::cmd("ZRANGE")
                .arg(key)
                .arg(start)
                .arg(stop)
                .arg("WITHSCORES")
                .query_async(&mut conn).await?;
            Ok(result.into_iter().map(|(member, score)| SortedSetMember { member, score }).collect())
        } else {
            let result: Vec<String> = redis::cmd("ZRANGE")
                .arg(key)
                .arg(start)
                .arg(stop)
                .query_async(&mut conn).await?;
            Ok(result.into_iter().map(|m| SortedSetMember { member: m, score: 0.0 }).collect())
        }
    }

    pub async fn zset_range_by_score(&mut self, key: &str, min: f64, max: f64, with_scores: bool) -> Result<Vec<SortedSetMember>> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        if with_scores {
            let result: Vec<(String, f64)> = redis::cmd("ZRANGEBYSCORE")
                .arg(key)
                .arg(min)
                .arg(max)
                .arg("WITHSCORES")
                .query_async(&mut conn).await?;
            Ok(result.into_iter().map(|(member, score)| SortedSetMember { member, score }).collect())
        } else {
            let result: Vec<String> = redis::cmd("ZRANGEBYSCORE")
                .arg(key)
                .arg(min)
                .arg(max)
                .query_async(&mut conn).await?;
            Ok(result.into_iter().map(|m| SortedSetMember { member: m, score: 0.0 }).collect())
        }
    }

    pub async fn zset_remove(&mut self, key: &str, members: &[String]) -> Result<usize> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let removed: usize = redis::cmd("ZREM")
            .arg(key)
            .arg(members)
            .query_async(&mut conn)
            .await?;
        Ok(removed)
    }

    pub async fn zset_cardinality(&mut self, key: &str) -> Result<usize> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let cardinality: usize = redis::cmd("ZCARD").arg(key).query_async(&mut conn).await?;
        Ok(cardinality)
    }

    pub async fn zset_score(&mut self, key: &str, member: &str) -> Result<Option<f64>> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let score: Option<f64> = redis::cmd("ZSCORE")
            .arg(key)
            .arg(member)
            .query_async(&mut conn)
            .await?;
        Ok(score)
    }

    pub async fn zset_rank(&mut self, key: &str, member: &str, reverse: bool) -> Result<Option<usize>> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let cmd = if reverse { "ZREVRANK" } else { "ZRANK" };
        let rank: Option<usize> = redis::cmd(cmd)
            .arg(key)
            .arg(member)
            .query_async(&mut conn)
            .await?;
        Ok(rank)
    }

    pub async fn zset_count(&mut self, key: &str, min: f64, max: f64) -> Result<usize> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let count: usize = redis::cmd("ZCOUNT")
            .arg(key)
            .arg(min)
            .arg(max)
            .query_async(&mut conn)
            .await?;
        Ok(count)
    }

    pub async fn zset_remove_range_by_score(&mut self, key: &str, min: f64, max: f64) -> Result<usize> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let removed: usize = redis::cmd("ZREMRANGEBYSCORE")
            .arg(key)
            .arg(min)
            .arg(max)
            .query_async(&mut conn)
            .await?;
        Ok(removed)
    }

    // Redis Search methods
    pub async fn create_search_index(
        &mut self,
        index_name: &str,
        prefix: &str,
        fields: &[SearchIndexField],
    ) -> Result<String> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let mut cmd = redis::cmd("FT.CREATE");
        cmd.arg(index_name)
            .arg("ON")
            .arg("HASH")
            .arg("PREFIX")
            .arg(1)
            .arg(prefix)
            .arg("SCHEMA");

        for field in fields {
            let mut field_def = field.field_type.clone();
            if field.sortable {
                field_def.push_str(" SORTABLE");
            }
            cmd.arg(&format!("{} AS {}", field.name, field_def));
        }

        let result: String = cmd.query_async(&mut conn).await?;
        Ok(result)
    }

    pub async fn search_index(
        &mut self,
        index_name: &str,
        query: &str,
        limit: usize,
    ) -> Result<Vec<SearchResult>> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let results: Vec<(String, f64)> = redis::cmd("FT.SEARCH")
            .arg(index_name)
            .arg(query)
            .arg("LIMIT")
            .arg(0)
            .arg(limit)
            .query_async(&mut conn)
            .await?;

        Ok(results.into_iter().map(|(key, score)| SearchResult { key, score, payload: String::new() }).collect())
    }

    pub async fn drop_index(&mut self, index_name: &str) -> Result<bool> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let result: Result<String, redis::RedisError> = redis::cmd("FT.DROP")
            .arg(index_name)
            .query_async(&mut conn)
            .await;

        Ok(result.is_ok())
    }

    pub async fn get_index_info(&mut self, index_name: &str) -> Result<String> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let info: String = redis::cmd("FT.INFO")
            .arg(index_name)
            .query_async(&mut conn)
            .await?;
        Ok(info)
    }

    pub async fn create_vector_index(
        &mut self,
        request: &CreateVectorIndexRequest,
    ) -> Result<String> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let mut cmd = redis::cmd("FT.CREATE");
        cmd.arg(&request.index_name)
            .arg("ON")
            .arg("HASH")
            .arg("PREFIX")
            .arg(1)
            .arg(&request.prefix)
            .arg("SCHEMA");

        let field = &request.vector_field;
        cmd.arg(&field.name)
            .arg("VECTOR")
            .arg(&field.algorithm)
            .arg(6)
            .arg("TYPE")
            .arg("FLOAT32")
            .arg("DIM")
            .arg(field.dimensions)
            .arg("DISTANCE_METRIC")
            .arg(&field.distance_metric);

        if field.algorithm == "HNSW" {
            cmd.arg("INITIAL_CAP").arg(field.initial_cap.unwrap_or(1000));
            cmd.arg("M").arg(field.m.unwrap_or(16));
            cmd.arg("EF_CONSTRUCTION").arg(field.ef_construction.unwrap_or(200));
            cmd.arg("EF_RUNTIME").arg(field.ef_runtime.unwrap_or(10));
        } else {
            cmd.arg("INITIAL_CAP").arg(field.initial_cap.unwrap_or(1000));
        }

        let result: String = cmd.query_async(&mut conn).await?;
        Ok(result)
    }

    pub async fn vector_search(
        &mut self,
        request: &VectorSearchRequest,
    ) -> Result<Vec<VectorSearchResult>> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let vector_bytes: Vec<u8> = request.query_vector
            .iter()
            .flat_map(|f| f.to_le_bytes())
            .collect();

        let top_k = request.top_k.unwrap_or(10);
        let query = format!(
            "*=>[KNN {} @{} $BLOB]",
            top_k, request.vector_field
        );

        let mut cmd = redis::cmd("FT.SEARCH");
        cmd.arg(&request.index_name)
            .arg(&query)
            .arg("PARAMS")
            .arg(2)
            .arg("BLOB")
            .arg(&vector_bytes);

        if let Some(ref fields) = request.return_fields {
            cmd.arg("RETURN").arg(fields.len());
            for field in fields {
                cmd.arg(field);
            }
        }

        let result: redis::Value = cmd.query_async(&mut conn).await?;

        let results = parse_vector_search_result(&result, request.return_fields.as_ref());
        Ok(results)
    }

    pub async fn upload_embeddings(
        &mut self,
        index_name: &str,
        embeddings: &[EmbeddingCacheItem],
    ) -> Result<usize> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let mut count = 0;
        for item in embeddings {
            let vector_bytes: Vec<u8> = item.embedding
                .iter()
                .flat_map(|f| (*f as f32).to_le_bytes())
                .collect();

            let metadata_str = item.metadata
                .as_ref()
                .map(|m| serde_json::to_string(m).unwrap_or_default());

            redis::cmd("HSET")
                .arg(&item.key)
                .arg("embedding")
                .arg(&vector_bytes)
                .arg("text")
                .arg(&item.text)
                .query_async::<_, i32>(&mut conn)
                .await?;

            if let Some(ref meta) = metadata_str {
                redis::cmd("HSET")
                    .arg(&item.key)
                    .arg("metadata")
                    .arg(meta)
                    .query_async::<_, i32>(&mut conn)
                    .await?;
            }

            count += 1;
        }

        Ok(count)
    }

    pub async fn get_cached_embedding(
        &mut self,
        key: &str,
    ) -> Result<Option<EmbeddingCacheItem>> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let data: std::collections::HashMap<String, redis::Value> = redis::cmd("HGETALL")
            .arg(key)
            .query_async(&mut conn)
            .await?;

        if data.is_empty() {
            return Ok(None);
        }

        let text = data.get("text")
            .and_then(|v| {
                if let redis::Value::Data(s) = v {
                    String::from_utf8_lossy(s).to_string().into()
                } else {
                    None
                }
            })
            .unwrap_or_default();

        let embedding = data.get("embedding")
            .and_then(|v| {
                if let redis::Value::Data(bytes) = v {
                    let vec: Vec<f64> = bytes
                        .chunks_exact(4)
                        .map(|chunk| f32::from_le_bytes([chunk[0], chunk[1], chunk[2], chunk[3]]) as f64)
                        .collect();
                    Some(vec)
                } else {
                    None
                }
            })
            .unwrap_or_default();

        let metadata = data.get("metadata")
            .and_then(|v| {
                if let redis::Value::Data(s) = v {
                    serde_json::from_slice(s).ok()
                } else {
                    None
                }
            });

        Ok(Some(EmbeddingCacheItem {
            key: key.to_string(),
            text,
            embedding,
            metadata,
        }))
    }

    pub async fn list_vector_indexes(&mut self) -> Result<Vec<String>> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let result: Vec<redis::Value> = redis::cmd("FT._LIST")
            .query_async(&mut conn)
            .await?;

        let mut indexes = Vec::new();
        for val in result {
            if let redis::Value::Data(s) = val {
                indexes.push(String::from_utf8_lossy(&s).to_string());
            }
        }

        Ok(indexes)
    }

    pub async fn get_vector_index_info(
        &mut self,
        index_name: &str,
    ) -> Result<VectorIndexInfo> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let result: Vec<redis::Value> = redis::cmd("FT.INFO")
            .arg(index_name)
            .query_async(&mut conn)
            .await?;

        let mut index_info = VectorIndexInfo {
            index_name: index_name.to_string(),
            index_status: "unknown".to_string(),
            schema_fields: Vec::new(),
            num_docs: 0,
            vector_field: None,
            vector_dimensions: None,
        };

        let mut i = 0;
        while i + 1 < result.len() {
            let key = &result[i];
            let value = &result[i + 1];

            if let redis::Value::Data(k) = key {
                let key_str = String::from_utf8_lossy(k);
                match key_str.as_ref() {
                    "index_status" => {
                        if let redis::Value::Data(v) = value {
                            index_info.index_status = String::from_utf8_lossy(v).to_string();
                        }
                    }
                    "num_docs" => {
                        if let redis::Value::Int(v) = value {
                            index_info.num_docs = *v as usize;
                        }
                    }
                    "schema" => {
                        if let redis::Value::Bulk(fields) = value {
                            for field in fields {
                                if let redis::Value::Bulk(field_info) = field {
                                    let mut name = String::new();
                                    let mut field_type = String::new();
                                    let mut sortable = false;
                                    let mut is_vector = false;
                                    let mut dimensions = None;

                                    for chunk in field_info.chunks(2) {
                                        if chunk.len() == 2 {
                                            if let (redis::Value::Data(k), redis::Value::Data(v)) = (&chunk[0], &chunk[1]) {
                                                let k_str = String::from_utf8_lossy(k);
                                                match k_str.as_ref() {
                                                    "name" => name = String::from_utf8_lossy(v).to_string(),
                                                    "type" => {
                                                        field_type = String::from_utf8_lossy(v).to_string();
                                                        is_vector = field_type == "VECTOR";
                                                    }
                                                    "sortable" => sortable = String::from_utf8_lossy(v) == "1",
                                                    _ => {}
                                                }
                                            }
                                        }
                                    }

                                    if is_vector {
                                        index_info.vector_field = Some(name.clone());
                                        for chunk in field_info.chunks(2) {
                                            if let (redis::Value::Data(k), redis::Value::Int(v)) = (&chunk[0], &chunk[1]) {
                                                if String::from_utf8_lossy(k) == "dim" {
                                                    dimensions = Some(*v as usize);
                                                }
                                            }
                                        }
                                        index_info.vector_dimensions = dimensions;
                                    }

                                    index_info.schema_fields.push(IndexFieldInfo {
                                        name,
                                        field_type,
                                        sortable,
                                    });
                                }
                            }
                        }
                    }
                    _ => {}
                }
            }
            i += 2;
        }

        Ok(index_info)
    }

    pub async fn delete_vector_index(&mut self, index_name: &str) -> Result<bool> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        redis::cmd("FT.DROPINDEX")
            .arg(index_name)
            .arg("DD")
            .query_async::<_, ()>(&mut conn)
            .await?;
        Ok(true)
    }

    pub async fn get_embedding_clusters(
        &mut self,
        index_name: &str,
        vector_field: &str,
        num_clusters: usize,
        sample_size: Option<usize>,
    ) -> Result<ClusterVisualization> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let limit = sample_size.unwrap_or(1000);
        
        let result: redis::Value = redis::cmd("FT.SEARCH")
            .arg(index_name)
            .arg("*")
            .arg("LIMIT")
            .arg(0)
            .arg(limit)
            .arg("RETURN")
            .arg(3)
            .arg(vector_field)
            .arg("__key")
            .arg("text")
            .query_async(&mut conn)
            .await?;

        let mut embeddings: Vec<(String, Vec<f64>, Option<String>)> = Vec::new();
        
        if let redis::Value::Bulk(results) = result {
            let mut i = 0;
            while i + 2 < results.len() {
                let key = &results[i];
                let fields = &results[i + 1];
                
                let key_str = if let redis::Value::Data(k) = key {
                    String::from_utf8_lossy(k).to_string()
                } else {
                    i += 2;
                    continue;
                };

                let mut embedding = Vec::new();
                let mut text = None;

                if let redis::Value::Bulk(field_pairs) = fields {
                    for chunk in field_pairs.chunks(2) {
                        if chunk.len() == 2 {
                            if let (redis::Value::Data(k), redis::Value::Data(v)) = (&chunk[0], &chunk[1]) {
                                let field_name = String::from_utf8_lossy(k);
                                if field_name == "embedding" || field_name == vector_field {
                                    embedding = v.chunks_exact(4)
                                        .map(|c| f32::from_le_bytes([c[0], c[1], c[2], c[3]]) as f64)
                                        .collect();
                                } else if field_name == "text" {
                                    text = Some(String::from_utf8_lossy(v).to_string());
                                }
                            }
                        }
                    }
                }

                if !embedding.is_empty() {
                    embeddings.push((key_str, embedding, text));
                }
                
                i += 2;
            }
        }

        let points = compute_clusters(&embeddings, num_clusters);
        
        let mut centroids: Vec<(f64, f64)> = vec![(0.0, 0.0); num_clusters];
        let mut counts: Vec<usize> = vec![0; num_clusters];
        
        for point in &points {
            centroids[point.cluster_id].0 += point.x;
            centroids[point.cluster_id].1 += point.y;
            counts[point.cluster_id] += 1;
        }
        
        for i in 0..num_clusters {
            if counts[i] > 0 {
                centroids[i].0 /= counts[i] as f64;
                centroids[i].1 /= counts[i] as f64;
            }
        }

        Ok(ClusterVisualization {
            points,
            num_clusters,
            cluster_centroids: centroids,
        })
    }

    // Time Series methods
    pub async fn create_time_series(
        &mut self,
        key: &str,
        retention_ms: Option<i64>,
    ) -> Result<String> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let mut cmd = redis::cmd("TS.CREATE");
        cmd.arg(key);
        if let Some(retention) = retention_ms {
            cmd.arg("RETENTION").arg(retention);
        }

        let result: String = cmd.query_async(&mut conn).await?;
        Ok(result)
    }

    pub async fn add_time_series_data(
        &mut self,
        key: &str,
        timestamp: i64,
        value: f64,
    ) -> Result<bool> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let result: Result<String, redis::RedisError> = redis::cmd("TS.ADD")
            .arg(key)
            .arg("*")
            .arg(timestamp)
            .arg(value)
            .query_async(&mut conn)
            .await;

        Ok(result.is_ok())
    }

    pub async fn get_time_series_range(
        &mut self,
        key: &str,
        from_ts: Option<i64>,
        to_ts: Option<i64>,
        count: Option<usize>,
    ) -> Result<Vec<TimeSeriesDataPoint>> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let mut cmd = redis::cmd("TS.RANGE");
        cmd.arg(key);
        if let Some(from) = from_ts {
            cmd.arg(from);
        } else {
            cmd.arg("-");
        }
        if let Some(to) = to_ts {
            cmd.arg(to);
        } else {
            cmd.arg("+");
        }
        if let Some(cnt) = count {
            cmd.arg("COUNT").arg(cnt);
        }

        let results: Vec<(i64, f64)> = cmd.query_async(&mut conn).await?;
        Ok(results.into_iter().map(|(timestamp, value)| TimeSeriesDataPoint { timestamp, value }).collect())
    }

    // Streams methods
    pub async fn xadd(
        &mut self,
        key: &str,
        stream_id: &str,
        field: &str,
        value: &str,
    ) -> Result<String> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let id: String = redis::cmd("XADD")
            .arg(key)
            .arg(&stream_id)
            .arg(&field)
            .arg(&value)
            .query_async(&mut conn).await?;
        Ok(id)
    }

    pub async fn xrange(
        &mut self,
        key: &str,
        stream_id: &str,
        start: &str,
        end: &str,
        count: Option<usize>,
    ) -> Result<Vec<StreamMessage>> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let results: Vec<(String, String, String)> = redis::cmd("XRANGE")
            .arg(key)
            .arg(start)
            .arg(end)
            .arg("COUNT")
            .arg(count.unwrap_or(100))
            .query_async(&mut conn).await?;

        Ok(results.into_iter().map(|(id, field, value)| StreamMessage { id, field, value }).collect())
    }

    pub async fn xreadgroup(
        &mut self,
        key: &str,
        group: &str,
        consumer: &str,
        count: Option<usize>,
    ) -> Result<Vec<StreamMessage>> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let results: Vec<(String, String, String)> = redis::cmd("XREADGROUP")
            .arg("GROUP")
            .arg(group)
            .arg(consumer)
            .arg("STREAMS")
            .arg(key)
            .arg(">")
            .arg("COUNT")
            .arg(count.unwrap_or(100))
            .query_async(&mut conn).await?;

        Ok(results.into_iter().map(|(id, field, value)| StreamMessage { id, field, value }).collect())
    }

    pub async fn get_stream_info(&mut self, key: &str) -> Result<String> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let info: String = redis::cmd("XINFO").arg(key).query_async(&mut conn).await?;
        Ok(info)
    }
}

fn parse_vector_search_result(
    result: &redis::Value,
    return_fields: Option<&Vec<String>>,
) -> Vec<VectorSearchResult> {
    let mut results = Vec::new();

    if let redis::Value::Bulk(data) = result {
        if data.is_empty() {
            return results;
        }

        let mut i = 0;
        while i + 2 < data.len() {
            let total = &data[i];
            if let redis::Value::Int(_) = total {
                i += 1;
                continue;
            }

            let key_val = &data[i];
            let fields_val = &data[i + 1];

            let key = if let redis::Value::Data(k) = key_val {
                String::from_utf8_lossy(k).to_string()
            } else {
                i += 2;
                continue;
            };

            let mut score = 0.0;
            let mut fields = None;

            if let redis::Value::Bulk(field_pairs) = fields_val {
                let mut field_map = serde_json::Map::new();

                for chunk in field_pairs.chunks(2) {
                    if chunk.len() == 2 {
                        let field_name = if let redis::Value::Data(n) = &chunk[0] {
                            String::from_utf8_lossy(n).to_string()
                        } else {
                            continue;
                        };

                        let field_value = match &chunk[1] {
                            redis::Value::Data(v) => {
                                let s = String::from_utf8_lossy(v);
                                if field_name == "__embedding_score" || field_name == "embedding_score" {
                                    if let Ok(s) = s.parse::<f64>() {
                                        score = s;
                                    }
                                }
                                serde_json::Value::String(s.to_string())
                            }
                            redis::Value::Int(v) => serde_json::Value::Number((*v).into()),
                            _ => serde_json::Value::Null,
                        };

                        if return_fields.is_none() || return_fields.unwrap().contains(&field_name) {
                            field_map.insert(field_name, field_value);
                        }
                    }
                }

                if !field_map.is_empty() {
                    fields = Some(serde_json::Value::Object(field_map));
                }
            }

            results.push(VectorSearchResult {
                key,
                score,
                fields,
            });

            i += 2;
        }
    }

    results
}

fn compute_clusters(
    embeddings: &[(String, Vec<f64>, Option<String>)],
    num_clusters: usize,
) -> Vec<ClusterPoint> {
    if embeddings.is_empty() || num_clusters == 0 {
        return Vec::new();
    }

    let dims = embeddings[0].1.len();
    
    let mut min_vals = vec![f64::MAX; dims];
    let mut max_vals = vec![f64::MIN; dims];
    
    for (_, embedding, _) in embeddings {
        for (i, &val) in embedding.iter().enumerate() {
            min_vals[i] = min_vals[i].min(val);
            max_vals[i] = max_vals[i].max(val);
        }
    }

    let reduced: Vec<(String, (f64, f64), Option<String>)> = embeddings
        .iter()
        .map(|(key, embedding, text)| {
            let x = if dims > 0 {
                embedding.iter().take(dims / 2).sum::<f64>() / (dims / 2).max(1) as f64
            } else {
                0.0
            };
            let y = if dims > 1 {
                embedding.iter().skip(dims / 2).take(dims / 2).sum::<f64>() / (dims / 2).max(1) as f64
            } else {
                0.0
            };
            (key.clone(), (x, y), text.clone())
        })
        .collect();

    let mut centroids: Vec<(f64, f64)> = reduced
        .iter()
        .take(num_clusters)
        .map(|(_, coords, _)| *coords)
        .collect();

    while centroids.len() < num_clusters {
        centroids.push((0.0, 0.0));
    }

    let mut assignments: Vec<usize> = vec![0; reduced.len()];
    
    for _ in 0..10 {
        for (i, (_, coords, _)) in reduced.iter().enumerate() {
            let mut min_dist = f64::MAX;
            let mut best_cluster = 0;
            
            for (j, centroid) in centroids.iter().enumerate() {
                let dist = (coords.0 - centroid.0).powi(2) + (coords.1 - centroid.1).powi(2);
                if dist < min_dist {
                    min_dist = dist;
                    best_cluster = j;
                }
            }
            assignments[i] = best_cluster;
        }

        let mut new_centroids: Vec<(f64, f64)> = vec![(0.0, 0.0); num_clusters];
        let mut counts: Vec<usize> = vec![0; num_clusters];
        
        for (i, (_, coords, _)) in reduced.iter().enumerate() {
            new_centroids[assignments[i]].0 += coords.0;
            new_centroids[assignments[i]].1 += coords.1;
            counts[assignments[i]] += 1;
        }
        
        for i in 0..num_clusters {
            if counts[i] > 0 {
                centroids[i] = (new_centroids[i].0 / counts[i] as f64, new_centroids[i].1 / counts[i] as f64);
            }
        }
    }

    let mut min_x = f64::MAX;
    let mut max_x = f64::MIN;
    let mut min_y = f64::MAX;
    let mut max_y = f64::MIN;
    
    for (_, coords, _) in &reduced {
        min_x = min_x.min(coords.0);
        max_x = max_x.max(coords.0);
        min_y = min_y.min(coords.1);
        max_y = max_y.max(coords.1);
    }

    let range_x = (max_x - min_x).max(1.0);
    let range_y = (max_y - min_y).max(1.0);

    reduced
        .iter()
        .zip(assignments.iter())
        .map(|((key, coords, text), &cluster_id)| {
            ClusterPoint {
                key: key.clone(),
                x: (coords.0 - min_x) / range_x,
                y: (coords.1 - min_y) / range_y,
                cluster_id,
                label: text.clone(),
            }
        })
        .collect()
}
