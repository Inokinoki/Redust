use crate::commands::ConnectionConfig;
use crate::redis_client::RedisManager;
use serde::{Deserialize, Serialize};
use tauri::State;

#[tauri::command]
pub async fn listLen(
    config: ConnectionConfig,
    key: String,
) -> Result<usize, String> {
    let mut manager = RedisManager::new(config);
    manager
        .list_len(&key)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn listRange(
    config: ConnectionConfig,
    key: String,
    start: i64,
    stop: i64,
) -> Result<Vec<String>, String> {
    let mut manager = RedisManager::new(config);
    manager
        .list_range(&key, start, stop)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn listPush(
    config: ConnectionConfig,
    key: String,
    values: Vec<String>,
    left: bool,
) -> Result<usize, String> {
    let mut manager = RedisManager::new(config);
    manager
        .list_push(&key, &values, left)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn listPop(
    config: ConnectionConfig,
    key: String,
    left: bool,
) -> Result<Option<String>, String> {
    let mut manager = RedisManager::new(config);
    manager
        .list_pop(&key, left)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn listIndex(
    config: ConnectionConfig,
    key: String,
    index: i64,
) -> Result<Option<String>, String> {
    let mut manager = RedisManager::new(config);
    manager
        .list_index(&key, index)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn listRemove(
    config: ConnectionConfig,
    key: String,
    count: i64,
    value: String,
) -> Result<i64, String> {
    let mut manager = RedisManager::new(config);
    manager
        .list_remove(&key, count, &value)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn listTrim(
    config: ConnectionConfig,
    key: String,
    start: i64,
    stop: i64,
) -> Result<bool, String> {
    let mut manager = RedisManager::new(config);
    manager
        .list_trim(&key, start, stop)
        .await
        .map_err(|e| e.to_string())
}
