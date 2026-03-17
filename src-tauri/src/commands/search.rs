use crate::commands::ConnectionConfig;
use crate::redis_client::RedisManager;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchIndexField {
    pub name: String,
    pub field_type: String,
    pub sortable: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateIndexRequest {
    pub index_name: String,
    pub prefix: String,
    pub fields: Vec<SearchIndexField>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub key: String,
    pub score: f64,
    pub payload: String,
}

#[tauri::command]
pub async fn createIndex(
    config: ConnectionConfig,
    request: CreateIndexRequest,
) -> Result<String, String> {
    let mut manager = RedisManager::new(config);
    manager
        .create_search_index(&request.index_name, &request.prefix, &request.fields)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn searchIndex(
    config: ConnectionConfig,
    index_name: String,
    query: String,
    limit: Option<usize>,
) -> Result<Vec<SearchResult>, String> {
    let mut manager = RedisManager::new(config);
    manager
        .search_index(&index_name, &query, limit.unwrap_or(10))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn dropIndex(
    config: ConnectionConfig,
    index_name: String,
) -> Result<bool, String> {
    let mut manager = RedisManager::new(config);
    manager
        .drop_index(&index_name)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn getIndexInfo(
    config: ConnectionConfig,
    index_name: String,
) -> Result<String, String> {
    let mut manager = RedisManager::new(config);
    manager
        .get_index_info(&index_name)
        .await
        .map_err(|e| e.to_string())
}
