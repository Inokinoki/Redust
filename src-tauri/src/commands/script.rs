use crate::commands::ConnectionConfig;
use crate::redis_client::RedisManager;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct ScriptExecutionRequest {
    pub script: String,
    pub keys: Vec<String>,
    pub args: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScriptExecutionResult {
    pub result: String,
    pub success: bool,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn executeLuaScript(
    config: ConnectionConfig,
    request: ScriptExecutionRequest,
) -> Result<ScriptExecutionResult, String> {
    let mut manager = RedisManager::new(config);
    let client = manager.get_client().await.map_err(|e| e.to_string())?;
    let mut conn = client
        .get_multiplexed_async_connection()
        .await
        .map_err(|e| e.to_string())?;

    // Create EVAL command
    let mut cmd = redis::cmd("EVAL");

    // Add script
    cmd.arg(&request.script);

    // Add number of keys
    cmd.arg(request.keys.len());

    // Add keys
    for key in &request.keys {
        cmd.arg(key);
    }

    // Add arguments
    for arg in &request.args {
        cmd.arg(arg);
    }

    // Execute
    match cmd.query_async::<_, redis::Value>(&mut conn).await {
        Ok(value) => {
            let result = format!("{:?}", value);
            Ok(ScriptExecutionResult {
                result,
                success: true,
                error: None,
            })
        }
        Err(e) => Ok(ScriptExecutionResult {
            result: String::new(),
            success: false,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn loadScript(
    config: ConnectionConfig,
    script: String,
) -> Result<String, String> {
    let mut manager = RedisManager::new(config);
    let client = manager.get_client().await.map_err(|e| e.to_string())?;
    let mut conn = client
        .get_multiplexed_async_connection()
        .await
        .map_err(|e| e.to_string())?;

    let sha: String = redis::cmd("SCRIPT")
        .arg("LOAD")
        .arg(&script)
        .query_async(&mut conn)
        .await
        .map_err(|e| e.to_string())?;

    Ok(sha)
}

#[tauri::command]
pub async fn executeScriptBySha(
    config: ConnectionConfig,
    sha: String,
    keys: Vec<String>,
    args: Vec<String>,
) -> Result<ScriptExecutionResult, String> {
    let mut manager = RedisManager::new(config);
    let client = manager.get_client().await.map_err(|e| e.to_string())?;
    let mut conn = client
        .get_multiplexed_async_connection()
        .await
        .map_err(|e| e.to_string())?;

    // Create EVALSHA command
    let mut cmd = redis::cmd("EVALSHA");

    // Add SHA
    cmd.arg(&sha);

    // Add number of keys
    cmd.arg(keys.len());

    // Add keys
    for key in &keys {
        cmd.arg(key);
    }

    // Add arguments
    for arg in &args {
        cmd.arg(arg);
    }

    // Execute
    match cmd.query_async::<_, redis::Value>(&mut conn).await {
        Ok(value) => {
            let result = format!("{:?}", value);
            Ok(ScriptExecutionResult {
                result,
                success: true,
                error: None,
            })
        }
        Err(e) => Ok(ScriptExecutionResult {
            result: String::new(),
            success: false,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn scriptExists(
    config: ConnectionConfig,
    shas: Vec<String>,
) -> Result<Vec<bool>, String> {
    let mut manager = RedisManager::new(config);
    let client = manager.get_client().await.map_err(|e| e.to_string())?;
    let mut conn = client
        .get_multiplexed_async_connection()
        .await
        .map_err(|e| e.to_string())?;

    let mut cmd = redis::cmd("SCRIPT").arg("EXISTS");
    for sha in shas {
        cmd.arg(&sha);
    }

    let results: Vec<i64> = cmd
        .query_async(&mut conn)
        .await
        .map_err(|e| e.to_string())?;

    Ok(results.into_iter().map(|r| r == 1).collect())
}

#[tauri::command]
pub async fn flushScripts(config: ConnectionConfig) -> Result<String, String> {
    let mut manager = RedisManager::new(config);
    let client = manager.get_client().await.map_err(|e| e.to_string())?;
    let mut conn = client
        .get_multiplexed_async_connection()
        .await
        .map_err(|e| e.to_string())?;

    let result: String = redis::cmd("SCRIPT")
        .arg("FLUSH")
        .query_async(&mut conn)
        .await
        .map_err(|e| e.to_string())?;

    Ok(result)
}
