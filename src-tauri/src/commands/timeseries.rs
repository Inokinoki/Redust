use crate::commands::ConnectionConfig;
use crate::redis_client::RedisManager;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct TimeSeriesDataPoint {
    pub timestamp: i64,
    pub value: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTimeSeriesRequest {
    pub key: String,
    pub retention_ms: Option<i64>,
}

#[tauri::command]
pub async fn createTimeSeries(
    config: ConnectionConfig,
    request: CreateTimeSeriesRequest,
) -> Result<String, String> {
    let manager = RedisManager::new(config);
    manager
        .create_time_series(&request.key, request.retention_ms)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn addTimeSeriesData(
    config: ConnectionConfig,
    key: String,
    timestamp: i64,
    value: f64,
) -> Result<bool, String> {
    let manager = RedisManager::new(config);
    manager
        .add_time_series_data(&key, timestamp, value)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn getTimeSeriesRange(
    config: ConnectionConfig,
    key: String,
    from_ts: Option<i64>,
    to_ts: Option<i64>,
    count: Option<usize>,
) -> Result<Vec<TimeSeriesDataPoint>, String> {
    let manager = RedisManager::new(config);
    manager
        .get_time_series_range(&key, from_ts, to_ts, count)
        .await
        .map_err(|e| e.to_string())
}
