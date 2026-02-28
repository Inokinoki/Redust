use crate::commands::ConnectionConfig;
use crate::redis_client::RedisManager;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct StreamMessage {
    pub id: String,
    pub field: String,
    pub value: String,
}

#[tauri::command]
pub async fn xadd(
    config: ConnectionConfig,
    key: String,
    stream_id: String,
    field: String,
    value: String,
) -> Result<String, String> {
    let manager = RedisManager::new(config);
    manager
        .xadd(&key, &stream_id, &field, &value)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn xrange(
    config: ConnectionConfig,
    key: String,
    stream_id: String,
    start: String,
    end: String,
    count: Option<usize>,
) -> Result<Vec<StreamMessage>, String> {
    let manager = RedisManager::new(config);
    manager
        .xrange(&key, &stream_id, &start, &end, count)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn xreadgroup(
    config: ConnectionConfig,
    key: String,
    group: String,
    consumer: String,
    count: Option<usize>,
) -> Result<Vec<StreamMessage>, String> {
    let manager = RedisManager::new(config);
    manager
        .xreadgroup(&key, &group, &consumer, count)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn getStreamInfo(
    config: ConnectionConfig,
    key: String,
) -> Result<String, String> {
    let manager = RedisManager::new(config);
    manager
        .get_stream_info(&key)
        .await
        .map_err(|e| e.to_string())
}
