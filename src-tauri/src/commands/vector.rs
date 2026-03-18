use crate::commands::ConnectionConfig;
use crate::redis_client::RedisManager;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VectorFieldConfig {
    pub name: String,
    pub dimensions: usize,
    pub algorithm: String,
    pub distance_metric: String,
    pub initial_cap: Option<usize>,
    pub m: Option<usize>,
    pub ef_construction: Option<usize>,
    pub ef_runtime: Option<usize>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateVectorIndexRequest {
    pub index_name: String,
    pub prefix: String,
    pub vector_field: VectorFieldConfig,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VectorSearchRequest {
    pub index_name: String,
    pub query_vector: Vec<f64>,
    pub vector_field: String,
    pub top_k: Option<usize>,
    pub return_fields: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EmbeddingCacheItem {
    pub key: String,
    pub text: String,
    pub embedding: Vec<f64>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UploadEmbeddingsRequest {
    pub index_name: String,
    pub embeddings: Vec<EmbeddingCacheItem>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VectorSearchResult {
    pub key: String,
    pub score: f64,
    pub fields: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VectorIndexInfo {
    pub index_name: String,
    pub index_status: String,
    pub schema_fields: Vec<IndexFieldInfo>,
    pub num_docs: usize,
    pub vector_field: Option<String>,
    pub vector_dimensions: Option<usize>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IndexFieldInfo {
    pub name: String,
    pub field_type: String,
    pub sortable: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClusterPoint {
    pub key: String,
    pub x: f64,
    pub y: f64,
    pub cluster_id: usize,
    pub label: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClusterVisualization {
    pub points: Vec<ClusterPoint>,
    pub num_clusters: usize,
    pub cluster_centroids: Vec<(f64, f64)>,
}

#[tauri::command]
pub async fn createVectorIndex(
    config: ConnectionConfig,
    request: CreateVectorIndexRequest,
) -> Result<String, String> {
    let mut manager = RedisManager::new(config);
    manager
        .create_vector_index(&request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn vectorSearch(
    config: ConnectionConfig,
    request: VectorSearchRequest,
) -> Result<Vec<VectorSearchResult>, String> {
    let mut manager = RedisManager::new(config);
    manager
        .vector_search(&request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn uploadEmbeddings(
    config: ConnectionConfig,
    request: UploadEmbeddingsRequest,
) -> Result<usize, String> {
    let mut manager = RedisManager::new(config);
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
    let mut manager = RedisManager::new(config);
    manager
        .get_cached_embedding(&key)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn listVectorIndexes(config: ConnectionConfig) -> Result<Vec<String>, String> {
    let mut manager = RedisManager::new(config);
    manager
        .list_vector_indexes()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn getVectorIndexInfo(
    config: ConnectionConfig,
    index_name: String,
) -> Result<VectorIndexInfo, String> {
    let mut manager = RedisManager::new(config);
    manager
        .get_vector_index_info(&index_name)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn deleteVectorIndex(config: ConnectionConfig, index_name: String) -> Result<bool, String> {
    let mut manager = RedisManager::new(config);
    manager
        .delete_vector_index(&index_name)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn getEmbeddingClusters(
    config: ConnectionConfig,
    index_name: String,
    vector_field: String,
    num_clusters: usize,
    sample_size: Option<usize>,
) -> Result<ClusterVisualization, String> {
    let mut manager = RedisManager::new(config);
    manager
        .get_embedding_clusters(&index_name, &vector_field, num_clusters, sample_size)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn batchVectorSearch(
    config: ConnectionConfig,
    requests: Vec<VectorSearchRequest>,
) -> Result<Vec<Vec<VectorSearchResult>>, String> {
    let mut manager = RedisManager::new(config);
    let mut results = Vec::new();
    for request in requests {
        match manager.vector_search(&request).await {
            Ok(res) => results.push(res),
            Err(e) => return Err(e.to_string()),
        }
    }
    Ok(results)
}