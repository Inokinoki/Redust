use crate::commands::ConnectionConfig;
use crate::redis_client::RedisManager;
use tauri::State;

#[tauri::command]
pub async fn get_string(config: ConnectionConfig, key: String) -> Result<Option<String>, String> {
    let manager = RedisManager::new(config);
    manager.get_string(&key).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_string(
    config: ConnectionConfig,
    key: String,
    value: String,
    ttl: Option<i64>,
) -> Result<bool, String> {
    let manager = RedisManager::new(config);
    manager
        .set_string(&key, &value, ttl)
        .await
        .map_err(|e| e.to_string())
}
