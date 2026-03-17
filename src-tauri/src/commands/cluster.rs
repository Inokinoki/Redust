use crate::commands::ConnectionConfig;
use crate::redis_client::RedisManager;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClusterNode {
    pub id: String,
    pub role: String,
    pub host: String,
    pub port: u16,
    pub master_id: Option<String>,
    pub connected: bool,
    pub slots: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClusterInfo {
    pub cluster_enabled: bool,
    pub cluster_state: String,
    pub known_nodes: usize,
    pub nodes: Vec<ClusterNode>,
}

#[tauri::command]
pub async fn getClusterInfo(config: ConnectionConfig) -> Result<ClusterInfo, String> {
    let mut manager = RedisManager::new(config);
    let client = manager.get_client().await.map_err(|e| e.to_string())?;
    let mut conn = client
        .get_multiplexed_async_connection()
        .await
        .map_err(|e| e.to_string())?;

    // Check if cluster is enabled
    let cluster_info: String = redis::cmd("CLUSTER")
        .arg("INFO")
        .query_async(&mut conn)
        .await
        .map_err(|e| e.to_string())?;

    let cluster_enabled = cluster_info.contains("cluster_enabled:1");
    let cluster_state = extract_field(&cluster_info, "cluster_state").unwrap_or_else(|| "unknown".to_string());

    if !cluster_enabled {
        return Ok(ClusterInfo {
            cluster_enabled: false,
            cluster_state,
            known_nodes: 0,
            nodes: vec![],
        });
    }

    // Get cluster nodes
    let nodes_str: String = redis::cmd("CLUSTER")
        .arg("NODES")
        .query_async(&mut conn)
        .await
        .map_err(|e| e.to_string())?;

    let nodes = parse_cluster_nodes(&nodes_str);

    Ok(ClusterInfo {
        cluster_enabled,
        cluster_state,
        known_nodes: nodes.len(),
        nodes,
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SlotInfo {
    pub start: i64,
    pub end: i64,
    pub master: String,
    pub replicas: Vec<String>,
}

#[tauri::command]
pub async fn getClusterSlots(config: ConnectionConfig) -> Result<Vec<SlotInfo>, String> {
    let mut manager = RedisManager::new(config);
    let client = manager.get_client().await.map_err(|e| e.to_string())?;
    let mut conn = client
        .get_multiplexed_async_connection()
        .await
        .map_err(|e| e.to_string())?;

    let result: Vec<redis::Value> = redis::cmd("CLUSTER")
        .arg("SLOTS")
        .query_async(&mut conn)
        .await
        .map_err(|e| e.to_string())?;

    let mut slots = Vec::new();

    for slot_value in result {
        if let redis::Value::Bulk(parts) = slot_value {
            if parts.len() >= 3 {
                let start = if let redis::Value::Int(i) = parts[0] { i } else { 0 };
                let end = if let redis::Value::Int(i) = parts[1] { i } else { 0 };

                // Parse master and replicas
                let mut replicas = Vec::new();
                let master = if parts.len() > 2 {
                    if let redis::Value::Bulk(node_info) = &parts[2] {
                        if node_info.len() >= 2 {
                            if let redis::Value::Data(host) = &node_info[0] {
                                if let redis::Value::Int(port) = node_info[1] {
                                    format!("{}:{}", String::from_utf8_lossy(host), port)
                                } else {
                                    String::from("unknown")
                                }
                            } else {
                                String::from("unknown")
                            }
                        } else {
                            String::from("unknown")
                        }
                    } else {
                        String::from("unknown")
                    }
                } else {
                    String::from("unknown")
                };

                // Parse replicas
                for i in 3..parts.len() {
                    if let redis::Value::Bulk(node_info) = &parts[i] {
                        if node_info.len() >= 2 {
                            if let redis::Value::Data(host) = &node_info[0] {
                                if let redis::Value::Int(port) = node_info[1] {
                                    replicas.push(format!("{}:{}", String::from_utf8_lossy(host), port));
                                }
                            }
                        }
                    }
                }

                slots.push(SlotInfo {
                    start,
                    end,
                    master,
                    replicas,
                });
            }
        }
    }

    Ok(slots)
}

fn parse_cluster_nodes(nodes_str: &str) -> Vec<ClusterNode> {
    let mut nodes = Vec::new();

    for line in nodes_str.lines() {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 8 {
            let id = parts[0].to_string();
            let role_part = if parts.len() > 2 { parts[2].to_string() } else { "unknown".to_string() };
            let role = role_part.split(',').next().unwrap_or("unknown");

            let host = if parts.len() > 1 {
                let addr_parts: Vec<&str> = parts[1].split(':').collect();
                addr_parts[0].to_string()
            } else {
                String::from("unknown")
            };

            let port = if parts.len() > 1 {
                let addr_parts: Vec<&str> = parts[1].split(':').collect();
                if addr_parts.len() > 1 {
                    addr_parts[1].split('@').next().unwrap_or("6379").parse::<u16>().unwrap_or(6379)
                } else {
                    6379
                }
            } else {
                6379
            };

            let master_id = if parts.len() > 3 && !parts[3].is_empty() && parts[3] != "-" {
                Some(parts[3].to_string())
            } else {
                None
            };

            let connected = if parts.len() > 7 {
                parts[7] == "connected"
            } else {
                false
            };

            let slots = if parts.len() > 8 {
                let slot_parts: Vec<&str> = parts[8..].join(" ").split(',').collect();
                if slot_parts.is_empty() {
                    None
                } else {
                    Some(slot_parts[8.min(parts.len() - 1)].to_string())
                }
            } else {
                None
            };

            nodes.push(ClusterNode {
                id,
                role,
                host,
                port,
                master_id,
                connected,
                slots,
            });
        }
    }

    nodes
}

fn extract_field(info: &str, field: &str) -> Option<String> {
    for line in info.lines() {
        if let Some((key, value)) = line.split_once(':') {
            if key.trim() == field {
                return Some(value.trim().to_string());
            }
        }
    }
    None
}
