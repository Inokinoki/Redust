// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod redis_client;

use commands::*;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

fn setup_tray(app: &tauri::App) {
    let show = MenuItem::with_id(app, "show", "Show Redust", true, None::<&str>).unwrap();
    let quit = MenuItem::with_id(app, "quit", "Quit Redust", true, None::<&str>).unwrap();
    let separator = PredefinedMenuItem::separator(app).unwrap();

    let tray_menu = Menu::with_items(app, &[&show, &separator, &quit]).unwrap();

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("Redust — Redis GUI")
        .menu(&tray_menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)
        .expect("failed to create tray icon");
}

fn setup_menu(app: &tauri::App) {
    let new_conn = MenuItem::with_id(app, "new_conn", "New Connection", true, Some("CmdOrCtrl+Shift+N")).unwrap();
    let import_export = MenuItem::with_id(app, "import_export", "Import / Export…", true, None::<&str>).unwrap();
    let close_window = MenuItem::with_id(app, "close_window", "Close Window", true, Some("CmdOrCtrl+W")).unwrap();

    let file_menu = Submenu::with_items(
        app,
        "File",
        true,
        &[
            &new_conn,
            &import_export,
            &PredefinedMenuItem::separator(app).unwrap(),
            &close_window,
        ],
    )
    .unwrap();

    let undo = PredefinedMenuItem::undo(app, None).unwrap();
    let redo = PredefinedMenuItem::redo(app, None).unwrap();
    let sep1 = PredefinedMenuItem::separator(app).unwrap();
    let cut = PredefinedMenuItem::cut(app, None).unwrap();
    let copy = PredefinedMenuItem::copy(app, None).unwrap();
    let paste = PredefinedMenuItem::paste(app, None).unwrap();
    let select_all = PredefinedMenuItem::select_all(app, None).unwrap();

    let edit_menu = Submenu::with_items(
        app,
        "Edit",
        true,
        &[&undo, &redo, &sep1, &cut, &copy, &paste, &select_all],
    )
    .unwrap();

    let cmd_palette = MenuItem::with_id(app, "cmd_palette", "Command Palette…", true, Some("CmdOrCtrl+K")).unwrap();
    let sep2 = PredefinedMenuItem::separator(app).unwrap();
    let toggle_sidebar = MenuItem::with_id(app, "toggle_sidebar", "Toggle Sidebar", true, Some("CmdOrCtrl+B")).unwrap();
    let toggle_fullscreen = MenuItem::with_id(app, "toggle_fullscreen", "Toggle Full Screen", true, Some("F11")).unwrap();

    let view_menu = Submenu::with_items(
        app,
        "View",
        true,
        &[&cmd_palette, &sep2, &toggle_sidebar, &toggle_fullscreen],
    )
    .unwrap();

    let minimize = MenuItem::with_id(app, "minimize", "Minimize", true, Some("CmdOrCtrl+M")).unwrap();
    let sep3 = PredefinedMenuItem::separator(app).unwrap();
    let bring_all_front = MenuItem::with_id(app, "bring_all_front", "Bring All to Front", true, None::<&str>).unwrap();

    let window_menu = Submenu::with_items(
        app,
        "Window",
        true,
        &[&minimize, &sep3, &bring_all_front],
    )
    .unwrap();

    let about = MenuItem::with_id(app, "about", "About Redust", true, None::<&str>).unwrap();

    let help_menu = Submenu::with_items(app, "Help", true, &[&about]).unwrap();

    let menu = Menu::with_items(
        app,
        &[&file_menu, &edit_menu, &view_menu, &window_menu, &help_menu],
    )
    .unwrap();

    app.set_menu(menu).expect("failed to set menu");

    // Handle menu events by emitting to frontend
    let handle = app.handle().clone();
    app.on_menu_event(move |app, event| {
        let event_id = event.id.as_ref().to_string();
        match event_id.as_str() {
            "close_window" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.close();
                }
            }
            "minimize" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.minimize();
                }
            }
            "toggle_fullscreen" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.set_fullscreen(window.is_fullscreen().map_or(true, |f| !f));
                }
            }
            _ => {
                // Forward other menu events to the frontend
                let _ = handle.emit("menu-event", &event_id);
            }
        }
    });
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            setup_tray(app);
            setup_menu(app);
            Ok(())
        })
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
