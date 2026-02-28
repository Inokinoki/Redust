use crate::commands::ConnectionConfig;
use anyhow::{Context, Result};
use redis::AsyncCommands;
use redis::aio::{ConnectionManager, MultiplexedConnection};
use redis::{Client, ProtocolVersion};
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

    async fn get_client(&mut self) -> Result<Client> {
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
            client.set_protocol_version(ProtocolVersion::RESP3);

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
    pub async fn zset_add(&mut self, key: &str, members: &[(String, f64)]) -> Result<usize> {
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
                    .flat_map(|(m, s)| [s.to_string(), m.clone()])
                    .collect::<Vec<_>>()
            )
            .query_async(&mut conn)
            .await?;
        Ok(added)
    }

    pub async fn zset_range(&mut self, key: &str, start: i64, stop: i64, with_scores: bool) -> Result<Vec<(String, f64)>> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let mut cmd = redis::cmd("ZRANGE").arg(key).arg(start).arg(stop);
        if with_scores {
            cmd.arg("WITHSCORES");
        }

        if with_scores {
            let result: Vec<(String, f64)> = cmd.query_async(&mut conn).await?;
            Ok(result)
        } else {
            let result: Vec<String> = cmd.query_async(&mut conn).await?;
            Ok(result.into_iter().map(|m| (m, 0.0)).collect())
        }
    }

    pub async fn zset_range_by_score(&mut self, key: &str, min: f64, max: f64, with_scores: bool) -> Result<Vec<(String, f64)>> {
        let client = self.get_client().await?;
        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get connection")?;

        let mut cmd = redis::cmd("ZRANGEBYSCORE").arg(key).arg(min).arg(max);
        if with_scores {
            cmd.arg("WITHSCORES");
        }

        if with_scores {
            let result: Vec<(String, f64)> = cmd.query_async(&mut conn).await?;
            Ok(result)
        } else {
            let result: Vec<String> = cmd.query_async(&mut conn).await?;
            Ok(result.into_iter().map(|m| (m, 0.0)).collect())
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
