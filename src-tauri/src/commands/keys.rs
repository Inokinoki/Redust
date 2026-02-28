use crate::redis_client::RedisManager;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct KeyInfo {
    pub key: String,
    pub r#type: String,
    pub ttl: i64,
    pub size: Option<usize>,
}

#[tauri::command]
pub async fn get_keys(
    config: ConnectionConfig,
    pattern: Option<String>,
    count: Option<u64>,
) -> Result<Vec<KeyInfo>, String> {
    let manager = RedisManager::new(config);
    manager
        .get_keys(pattern.unwrap_or_else(|| "*".to_string()), count.unwrap_or(100))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_key(config: ConnectionConfig, key: String) -> Result<KeyInfo, String> {
    let manager = RedisManager::new(config);
    manager.get_key_info(&key).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_key(config: ConnectionConfig, key: String) -> Result<bool, String> {
    let manager = RedisManager::new(config);
    manager.delete_key(&key).await.map_err(|e| e.to_string())
}
