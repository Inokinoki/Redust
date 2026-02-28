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
