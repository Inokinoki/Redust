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
            // Add more commands as we implement features
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
