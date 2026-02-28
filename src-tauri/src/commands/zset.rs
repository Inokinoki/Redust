use crate::commands::ConnectionConfig;
use crate::redis_client::RedisManager;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct SortedSetMember {
    pub member: String,
    pub score: f64,
}

#[tauri::command]
pub async fn zsetAdd(
    config: ConnectionConfig,
    key: String,
    members: Vec<SortedSetMember>,
) -> Result<usize, String> {
    let manager = RedisManager::new(config);
    manager
        .zset_add(&key, &members)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn zsetRange(
    config: ConnectionConfig,
    key: String,
    start: i64,
    stop: i64,
    with_scores: bool,
) -> Result<Vec<SortedSetMember>, String> {
    let manager = RedisManager::new(config);
    manager
        .zset_range(&key, start, stop, with_scores)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn zsetRangeByScore(
    config: ConnectionConfig,
    key: String,
    min: f64,
    max: f64,
    with_scores: bool,
) -> Result<Vec<SortedSetMember>, String> {
    let manager = RedisManager::new(config);
    manager
        .zset_range_by_score(&key, min, max, with_scores)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn zsetRem(
    config: ConnectionConfig,
    key: String,
    members: Vec<String>,
) -> Result<usize, String> {
    let manager = RedisManager::new(config);
    manager
        .zset_remove(&key, &members)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn zsetCard(
    config: ConnectionConfig,
    key: String,
) -> Result<usize, String> {
    let manager = RedisManager::new(config);
    manager
        .zset_cardinality(&key)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn zsetScore(
    config: ConnectionConfig,
    key: String,
    member: String,
) -> Result<Option<f64>, String> {
    let manager = RedisManager::new(config);
    manager
        .zset_score(&key, &member)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn zsetRank(
    config: ConnectionConfig,
    key: String,
    member: String,
    reverse: bool,
) -> Result<Option<usize>, String> {
    let manager = RedisManager::new(config);
    manager
        .zset_rank(&key, &member, reverse)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn zsetCount(
    config: ConnectionConfig,
    key: String,
    min: f64,
    max: f64,
) -> Result<usize, String> {
    let manager = RedisManager::new(config);
    manager
        .zset_count(&key, min, max)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn zsetRemRangeByScore(
    config: ConnectionConfig,
    key: String,
    min: f64,
    max: f64,
) -> Result<usize, String> {
    let manager = RedisManager::new(config);
    manager
        .zset_remove_range_by_score(&key, min, max)
        .await
        .map_err(|e| e.to_string())
}
