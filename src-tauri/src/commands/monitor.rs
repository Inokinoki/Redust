use crate::commands::ConnectionConfig;
use crate::redis_client::RedisManager;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct MonitoringData {
    pub cpu: f64,
    pub memory: f64,
    pub used_memory: u64,
    pub keys: u64,
    pub connections: u64,
    pub commands_per_second: f64,
    pub redis_version: String,
    pub uptime: u64,
}

#[tauri::command]
pub async fn getMonitoringData(config: ConnectionConfig) -> Result<MonitoringData, String> {
    let mut manager = RedisManager::new(config);
    let info = manager
        .get_info()
        .await
        .map_err(|e| e.to_string())?;

    // Parse INFO command output
    let mut cpu = 0.0;
    let mut memory = 0.0;
    let mut used_memory = 0u64;
    let mut keys = 0u64;
    let mut connections = 0u64;
    let mut commands_per_second = 0.0;
    let mut redis_version = String::from("unknown");
    let mut uptime = 0u64;

    for line in info.lines() {
        if let Some((key, value)) = line.split_once(':') {
            match key.trim() {
                "used_cpu_sys" => cpu += value.trim().parse::<f64>().unwrap_or(0.0),
                "used_cpu_user" => cpu += value.trim().parse::<f64>().unwrap_or(0.0),
                "used_memory" => {
                    used_memory = value.trim().parse::<u64>().unwrap_or(0);
                }
                "total_system_memory" => {
                    if let Some(mem) = value.trim().parse::<u64>().ok() {
                        memory = mem as f64;
                    }
                }
                "total_keys" => {
                    keys += value.trim().parse::<u64>().unwrap_or(0);
                }
                "db0" => {
                    // Parse keys from db0 line: "db0:keys=100,expires=10,avg_ttl=0"
                    for part in value.split(',') {
                        if part.starts_with("keys=") {
                            keys += part
                                .trim_start_matches("keys=")
                                .parse::<u64>()
                                .unwrap_or(0);
                        }
                    }
                }
                "connected_clients" => {
                    connections = value.trim().parse::<u64>().unwrap_or(0);
                }
                "instantaneous_ops_per_sec" => {
                    commands_per_second = value.trim().parse::<f64>().unwrap_or(0.0);
                }
                "redis_version" => {
                    redis_version = value.trim().to_string();
                }
                "uptime_in_seconds" => {
                    uptime = value.trim().parse::<u64>().unwrap_or(0);
                }
                _ => {}
            }
        }
    }

    Ok(MonitoringData {
        cpu,
        memory,
        used_memory,
        keys,
        connections,
        commands_per_second,
        redis_version,
        uptime,
    })
}

#[tauri::command]
pub async fn getSlowLog(config: ConnectionConfig, count: usize) -> Result<Vec<String>, String> {
    let mut manager = RedisManager::new(config);
    let client = manager.get_client().await.map_err(|e| e.to_string())?;
    let mut conn = client
        .get_multiplexed_async_connection()
        .await
        .map_err(|e| e.to_string())?;

    let results: Vec<String> = redis::cmd("SLOWLOG")
        .arg("GET")
        .arg(count)
        .query_async(&mut conn)
        .await
        .map_err(|e| e.to_string())?;

    Ok(results)
}
