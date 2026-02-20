mod commands;
mod services;
mod setup;

use commands::{
    capture_full_screenshot, capture_screenshot, copy_image_to_clipboard, get_settings,
    hide_main_window, register_escape_shortcut, register_shortcut, save_base64_image,
    show_main_window, test_sftp_connection, unregister_escape_shortcut, update_settings,
    upload_to_sftp, greet,
};
use setup::{setup_global_shortcuts, setup_tray};
use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|app| {
            setup_tray(app.handle())?;
            setup_global_shortcuts(app.handle())?;
            Ok(())
        })
        .on_window_event(|window, event| {
            match event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    let _ = window.emit("window-close-requested", ());
                    window.hide().unwrap();
                    api.prevent_close();
                }
                tauri::WindowEvent::Focused(false) => {}
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            capture_screenshot,
            capture_full_screenshot,
            save_base64_image,
            get_settings,
            update_settings,
            test_sftp_connection,
            upload_to_sftp,
            show_main_window,
            hide_main_window,
            register_shortcut,
            register_escape_shortcut,
            unregister_escape_shortcut,
            copy_image_to_clipboard
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
