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
            delete_key,
            // Data type commands
            get_string,
            set_string,
            // Hash commands
            hashGet,
            hashGetAll,
            hashSet,
            hashDelete,
            hashExists,
            hashLen,
            hashKeys,
            hashValues,
            // List commands
            listLen,
            listRange,
            listPush,
            listPop,
            listIndex,
            listRemove,
            listTrim,
            // Set commands
            setAdd,
            setMembers,
            setRemove,
            setCard,
            setIsMember,
            setPop,
            setRandomMember,
            // Sorted Set commands
            zsetAdd,
            zsetRange,
            zsetRangeByScore,
            zsetRem,
            zsetCard,
            zsetScore,
            zsetRank,
            zsetCount,
            zsetRemRangeByScore,
            // Search commands
            createIndex,
            searchIndex,
            dropIndex,
            getIndexInfo,
            // Vector commands
            createVectorIndex,
            vectorSearch,
            listVectorIndexes,
            getVectorIndexInfo,
            deleteVectorIndex,
            uploadEmbeddings,
            getCachedEmbedding,
            getEmbeddingClusters,
            batchVectorSearch,
            // LLM commands
            llm_chat,
            llm_rag,
            llm_generate_embedding,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
