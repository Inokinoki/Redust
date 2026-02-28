use crate::commands::ConnectionConfig;
use crate::redis_client::RedisManager;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct VectorSearchRequest {
    pub key: String,
    pub query_vector: Vec<f64>,
    pub top_k: Option<usize>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EmbeddingCacheItem {
    pub key: String,
    pub text: String,
    pub embedding: Vec<f64>,
    pub metadata: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UploadEmbeddingsRequest {
    pub index_name: String,
    pub embeddings: Vec<EmbeddingCacheItem>,
}

#[tauri::command]
pub async fn vectorSearch(
    config: ConnectionConfig,
    request: VectorSearchRequest,
) -> Result<Vec<(String, f64)>, String> {
    let manager = RedisManager::new(config);
    manager
        .vector_search(&request.key, &request.query_vector, request.top_k.unwrap_or(10))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn uploadEmbeddings(
    config: ConnectionConfig,
    request: UploadEmbeddingsRequest,
) -> Result<usize, String> {
    let manager = RedisManager::new(config);
    manager
        .upload_embeddings(&request.index_name, &request.embeddings)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn getCachedEmbedding(
    config: ConnectionConfig,
    key: String,
) -> Result<Option<EmbeddingCacheItem>, String> {
    let manager = RedisManager::new(config);
    manager
        .get_cached_embedding(&key)
        .await
        .map_err(|e| e.to_string())
}
