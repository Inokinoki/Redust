use crate::redis_client::RedisManager;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct ConnectionConfig {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub password: Option<String>,
    pub database: Option<u8>,
    pub tls: bool,
}

#[tauri::command]
pub async fn test_connection(config: ConnectionConfig) -> Result<String, String> {
    let mut manager = RedisManager::new(config);
    match manager.test_connection().await {
        Ok(info) => Ok(format!("Connected: {}", info)),
        Err(e) => Err(format!("Connection failed: {}", e)),
    }
}

#[tauri::command]
pub async fn get_redis_info(config: ConnectionConfig) -> Result<String, String> {
    let mut manager = RedisManager::new(config);
    manager.get_info().await.map_err(|e| e.to_string())
}
