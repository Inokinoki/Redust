import { invoke } from "@tauri-apps/api/core";
import type { ConnectionConfig, KeyInfo } from "../types";

export async function testConnection(config: ConnectionConfig): Promise<string> {
  return await invoke("test_connection", { config });
}

export async function getRedisInfo(config: ConnectionConfig): Promise<string> {
  return await invoke("get_redis_info", { config });
}

export async function getKeys(
  config: ConnectionConfig,
  pattern?: string,
  count?: number
): Promise<KeyInfo[]> {
  return await invoke("get_keys", { config, pattern, count });
}

export async function getKey(
  config: ConnectionConfig,
  key: string
): Promise<KeyInfo> {
  return await invoke("get_key", { config, key });
}

export async function deleteKey(
  config: ConnectionConfig,
  key: string
): Promise<boolean> {
  return await invoke("delete_key", { config, key });
}

export async function getString(
  config: ConnectionConfig,
  key: string
): Promise<string | null> {
  return await invoke("get_string", { config, key });
}

export async function setString(
  config: ConnectionConfig,
  key: string,
  value: string,
  ttl?: number
): Promise<boolean> {
  return await invoke("set_string", { config, key, value, ttl });
}
