use crate::commands::ConnectionConfig;
use crate::redis_client::RedisManager;
use serde::{Deserialize, Serialize};
use tauri::State;
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct HashField {
    pub field: String,
    pub value: String,
}

#[tauri::command]
pub async fn hashGet(
    config: ConnectionConfig,
    key: String,
    field: String,
) -> Result<Option<String>, String> {
    let mut manager = RedisManager::new(config);
    manager
        .hash_get(&key, &field)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn hashGetAll(
    config: ConnectionConfig,
    key: String,
) -> Result<HashMap<String, String>, String> {
    let mut manager = RedisManager::new(config);
    manager
        .hash_get_all(&key)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn hashSet(
    config: ConnectionConfig,
    key: String,
    field: String,
    value: String,
) -> Result<bool, String> {
    let mut manager = RedisManager::new(config);
    manager
        .hash_set(&key, &field, &value)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn hashDelete(
    config: ConnectionConfig,
    key: String,
    field: String,
) -> Result<bool, String> {
    let mut manager = RedisManager::new(config);
    manager
        .hash_delete(&key, &field)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn hashExists(
    config: ConnectionConfig,
    key: String,
    field: String,
) -> Result<bool, String> {
    let mut manager = RedisManager::new(config);
    manager
        .hash_exists(&key, &field)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn hashLen(
    config: ConnectionConfig,
    key: String,
) -> Result<usize, String> {
    let mut manager = RedisManager::new(config);
    manager
        .hash_len(&key)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn hashKeys(
    config: ConnectionConfig,
    key: String,
) -> Result<Vec<String>, String> {
    let mut manager = RedisManager::new(config);
    manager
        .hash_keys(&key)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn hashValues(
    config: ConnectionConfig,
    key: String,
) -> Result<Vec<String>, String> {
    let mut manager = RedisManager::new(config);
    manager
        .hash_values(&key)
        .await
        .map_err(|e| e.to_string())
}
