use crate::commands::ConnectionConfig;
use crate::redis_client::RedisManager;
use serde::{Deserialize, Serialize};
use tauri::State;

#[tauri::command]
pub async fn setAdd(
    config: ConnectionConfig,
    key: String,
    members: Vec<String>,
) -> Result<usize, String> {
    let manager = RedisManager::new(config);
    manager
        .set_add(&key, &members)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn setMembers(
    config: ConnectionConfig,
    key: String,
) -> Result<Vec<String>, String> {
    let manager = RedisManager::new(config);
    manager
        .set_members(&key)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn setRemove(
    config: ConnectionConfig,
    key: String,
    members: Vec<String>,
) -> Result<usize, String> {
    let manager = RedisManager::new(config);
    manager
        .set_remove(&key, &members)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn setCard(
    config: ConnectionConfig,
    key: String,
) -> Result<usize, String> {
    let manager = RedisManager::new(config);
    manager
        .set_cardinality(&key)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn setIsMember(
    config: ConnectionConfig,
    key: String,
    member: String,
) -> Result<bool, String> {
    let manager = RedisManager::new(config);
    manager
        .set_is_member(&key, &member)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn setPop(
    config: ConnectionConfig,
    key: String,
) -> Result<Option<String>, String> {
    let manager = RedisManager::new(config);
    manager
        .set_pop(&key)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn setRandomMember(
    config: ConnectionConfig,
    key: String,
) -> Result<Option<String>, String> {
    let manager = RedisManager::new(config);
    manager
        .set_random_member(&key)
        .await
        .map_err(|e| e.to_string())
}
