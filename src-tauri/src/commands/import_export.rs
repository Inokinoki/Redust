use crate::commands::ConnectionConfig;
use crate::redis_client::RedisManager;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct KeyValue {
    pub key: String,
    pub r#type: String,
    pub value: String,
    pub ttl: Option<i64>,
}

#[tauri::command]
pub async fn exportKeys(
    config: ConnectionConfig,
    pattern: String,
) -> Result<Vec<KeyValue>, String> {
    let mut manager = RedisManager::new(config);
    let client = manager.get_client().await.map_err(|e| e.to_string())?;
    let mut conn = client
        .get_multiplexed_async_connection()
        .await
        .map_err(|e| e.to_string())?;

    // Get all keys matching pattern
    let keys: Vec<String> = redis::cmd("KEYS")
        .arg(&pattern)
        .query_async(&mut conn)
        .await
        .map_err(|e| e.to_string())?;

    let mut key_values = Vec::new();

    for key in keys {
        // Get key type
        let key_type: String = redis::cmd("TYPE")
            .arg(&key)
            .query_async(&mut conn)
            .await
            .map_err(|e| e.to_string())?;

        // Get TTL
        let ttl: i64 = redis::cmd("TTL")
            .arg(&key)
            .query_async(&mut conn)
            .await
            .map_err(|e| e.to_string())?;
        let ttl_opt = if ttl > 0 { Some(ttl) } else { None };

        // Get value based on type
        let value = match key_type.as_str() {
            "string" => {
                let val: String = redis::cmd("GET")
                    .arg(&key)
                    .query_async(&mut conn)
                    .await
                    .map_err(|e| e.to_string())?;
                val
            }
            "hash" => {
                let val: Vec<(String, String)> = redis::cmd("HGETALL")
                    .arg(&key)
                    .query_async(&mut conn)
                    .await
                    .map_err(|e| e.to_string())?;
                serde_json::to_string(&val).map_err(|e| e.to_string())?
            }
            "list" => {
                let val: Vec<String> = redis::cmd("LRANGE")
                    .arg(&key)
                    .arg(0)
                    .arg(-1)
                    .query_async(&mut conn)
                    .await
                    .map_err(|e| e.to_string())?;
                serde_json::to_string(&val).map_err(|e| e.to_string())?
            }
            "set" => {
                let val: Vec<String> = redis::cmd("SMEMBERS")
                    .arg(&key)
                    .query_async(&mut conn)
                    .await
                    .map_err(|e| e.to_string())?;
                serde_json::to_string(&val).map_err(|e| e.to_string())?
            }
            "zset" => {
                let val: Vec<(String, f64)> = redis::cmd("ZRANGE")
                    .arg(&key)
                    .arg(0)
                    .arg(-1)
                    .arg("WITHSCORES")
                    .query_async(&mut conn)
                    .await
                    .map_err(|e| e.to_string())?;
                serde_json::to_string(&val).map_err(|e| e.to_string())?
            }
            "stream" => {
                // For streams, export a limited number of entries
                let val: Vec<String> = redis::cmd("XRANGE")
                    .arg(&key)
                    .arg("-")
                    .arg("+")
                    .arg("COUNT")
                    .arg(100)
                    .query_async(&mut conn)
                    .await
                    .map_err(|e| e.to_string())?;
                serde_json::to_string(&val).map_err(|e| e.to_string())?
            }
            "json" => {
                // For JSON type, get the JSON value
                let val: String = redis::cmd("JSON.GET")
                    .arg(&key)
                    .query_async(&mut conn)
                    .await
                    .map_err(|e| e.to_string())?;
                val
            }
            _ => {
                // Unsupported type, skip
                continue;
            }
        };

        key_values.push(KeyValue {
            key,
            r#type: key_type,
            value,
            ttl: ttl_opt,
        });
    }

    Ok(key_values)
}

#[tauri::command]
pub async fn importKeys(
    config: ConnectionConfig,
    data: Vec<KeyValue>,
) -> Result<usize, String> {
    let mut manager = RedisManager::new(config);
    let client = manager.get_client().await.map_err(|e| e.to_string())?;
    let mut conn = client
        .get_multiplexed_async_connection()
        .await
        .map_err(|e| e.to_string())?;

    let mut imported = 0;

    for kv in data {
        match kv.r#type.as_str() {
            "string" => {
                redis::cmd("SET")
                    .arg(&kv.key)
                    .arg(&kv.value)
                    .query_async::<_, ()>(&mut conn)
                    .await
                    .map_err(|e| e.to_string())?;
            }
            "hash" => {
                let fields: Vec<(String, String)> = serde_json::from_str(&kv.value)
                    .map_err(|e| e.to_string())?;
                for (field, value) in fields {
                    redis::cmd("HSET")
                        .arg(&kv.key)
                        .arg(&field)
                        .arg(&value)
                        .query_async::<_, ()>(&mut conn)
                        .await
                        .map_err(|e| e.to_string())?;
                }
            }
            "list" => {
                let items: Vec<String> = serde_json::from_str(&kv.value)
                    .map_err(|e| e.to_string())?;
                for item in items {
                    redis::cmd("RPUSH")
                        .arg(&kv.key)
                        .arg(&item)
                        .query_async::<_, ()>(&mut conn)
                        .await
                        .map_err(|e| e.to_string())?;
                }
            }
            "set" => {
                let members: Vec<String> = serde_json::from_str(&kv.value)
                    .map_err(|e| e.to_string())?;
                for member in members {
                    redis::cmd("SADD")
                        .arg(&kv.key)
                        .arg(&member)
                        .query_async::<_, ()>(&mut conn)
                        .await
                        .map_err(|e| e.to_string())?;
                }
            }
            "zset" => {
                let items: Vec<(String, f64)> = serde_json::from_str(&kv.value)
                    .map_err(|e| e.to_string())?;
                for (member, score) in items {
                    redis::cmd("ZADD")
                        .arg(&kv.key)
                        .arg(score)
                        .arg(&member)
                        .query_async::<_, ()>(&mut conn)
                        .await
                        .map_err(|e| e.to_string())?;
                }
            }
            "json" => {
                redis::cmd("JSON.SET")
                    .arg(&kv.key)
                    .arg("$")
                    .arg(&kv.value)
                    .query_async::<_, ()>(&mut conn)
                    .await
                    .map_err(|e| e.to_string())?;
            }
            _ => {
                // Skip unsupported types
                continue;
            }
        }

        // Set TTL if present
        if let Some(ttl) = kv.ttl {
            redis::cmd("EXPIRE")
                .arg(&kv.key)
                .arg(ttl)
                .query_async::<_, ()>(&mut conn)
                .await
                .map_err(|e| e.to_string())?;
        }

        imported += 1;
    }

    Ok(imported)
}

#[tauri::command]
pub async fn deleteKeysByPattern(
    config: ConnectionConfig,
    pattern: String,
) -> Result<usize, String> {
    let mut manager = RedisManager::new(config);
    let client = manager.get_client().await.map_err(|e| e.to_string())?;
    let mut conn = client
        .get_multiplexed_async_connection()
        .await
        .map_err(|e| e.to_string())?;

    let keys: Vec<String> = redis::cmd("KEYS")
        .arg(&pattern)
        .query_async(&mut conn)
        .await
        .map_err(|e| e.to_string())?;

    if keys.is_empty() {
        return Ok(0);
    }

    let deleted: usize = redis::cmd("DEL")
        .arg(keys.clone())
        .query_async(&mut conn)
        .await
        .map_err(|e| e.to_string())?;

    Ok(deleted)
}
