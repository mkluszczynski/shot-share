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
use tauri::{Emitter, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    // Registering a second instance (e.g. autostart + a manual launch) would
    // otherwise race to register the same global shortcut; instead, focus the
    // existing window. Must be registered before other plugins, and only
    // applies on desktop targets.
    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }));
    }

    // The updater plugin only supports desktop targets.
    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_updater::Builder::new().build());
    }

    builder
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
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
                    // Prevent the window from closing and hide it instead
                    let _ = window.hide();
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
