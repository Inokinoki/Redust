use crate::commands::ConnectionConfig;
use crate::redis_client::RedisManager;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct PubSubMessage {
    pub channel: String;
    pub message: String,
    pub pattern: Option<String>,
}

#[tauri::command]
pub async fn publishMessage(
    config: ConnectionConfig,
    channel: String,
    message: String,
) -> Result<i64, String> {
    let mut manager = RedisManager::new(config);
    let client = manager.get_client().await.map_err(|e| e.to_string())?;
    let mut conn = client
        .get_multiplexed_async_connection()
        .await
        .map_err(|e| e.to_string())?;

    let subscribers: i64 = redis::cmd("PUBLISH")
        .arg(&channel)
        .arg(&message)
        .query_async(&mut conn)
        .await
        .map_err(|e| e.to_string())?;

    Ok(subscribers)
}

#[tauri::command]
pub async fn getPublicChannels(config: ConnectionConfig) -> Result<Vec<String>, String> {
    let mut manager = RedisManager::new(config);
    let client = manager.get_client().await.map_err(|e| e.to_string())?;
    let mut conn = client
        .get_multiplexed_async_connection()
        .await
        .map_err(|e| e.to_string())?;

    let channels: Vec<String> = redis::cmd("PUBSUB")
        .arg("CHANNELS")
        .query_async(&mut conn)
        .await
        .map_err(|e| e.to_string())?;

    Ok(channels)
}

#[tauri::command]
pub async fn getChannelSubscribers(
    config: ConnectionConfig,
    channel: String,
) -> Result<i64, String> {
    let mut manager = RedisManager::new(config);
    let client = manager.get_client().await.map_err(|e| e.to_string())?;
    let mut conn = client
        .get_multiplexed_async_connection()
        .await
        .map_err(|e| e.to_string())?;

    let count: i64 = redis::cmd("PUBSUB")
        .arg("NUMSUB")
        .arg(&channel)
        .query_async::<_, Vec<i64>>(&mut conn)
        .await
        .map_err(|e| e.to_string())?
        .get(1)
        .copied()
        .unwrap_or(0);

    Ok(count)
}

#[tauri::command]
pub async fn getActivePatterns(config: ConnectionConfig) -> Result<Vec<String>, String> {
    let mut manager = RedisManager::new(config);
    let client = manager.get_client().await.map_err(|e| e.to_string())?;
    let mut conn = client
        .get_multiplexed_async_connection()
        .await
        .map_err(|e| e.to_string())?;

    let patterns: Vec<String> = redis::cmd("PUBSUB")
        .arg("NUMPAT")
        .query_async::<_, i64>(&mut conn)
        .await
        .map_err(|e| e.to_string())?;

    // PUBSUB NUMPAT returns just the count, not the patterns themselves
    // For patterns, we would need to track them separately
    Ok(vec![])
}
