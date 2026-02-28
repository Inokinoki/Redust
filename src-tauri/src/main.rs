// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod redis_client;

use commands::*;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            // Connection commands
            test_connection,
            get_redis_info,
            // Key commands
            get_keys,
            get_key,
            set_key,
            delete_key,
            // Data type commands
            get_string,
            set_string,
            // Hash commands
            hash_get,
            hash_get_all,
            hash_set,
            hash_delete,
            hash_exists,
            hash_len,
            hash_keys,
            hash_values,
            // List commands
            list_len,
            list_range,
            list_push,
            list_pop,
            list_index,
            list_remove,
            list_trim,
            // Set commands
            set_add,
            set_members,
            set_remove,
            set_card,
            set_is_member,
            set_pop,
            set_random_member,
            // Sorted Set commands
            zset_add,
            zset_range,
            zset_range_by_score,
            zset_rem,
            zset_card,
            zset_score,
            zset_rank,
            zset_count,
            zset_rem_range_by_score,
            // Add more commands as we implement features
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
