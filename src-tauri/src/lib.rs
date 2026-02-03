use base64::{engine::general_purpose, Engine as _};
use std::io::Cursor;
use std::path::PathBuf;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager};
use xcap::image::GenericImageView;
use xcap::Monitor;

mod settings;
use settings::Settings;

mod sftp;
use sftp::SftpUploader;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn capture_full_screenshot() -> Result<String, String> {
    let monitors = Monitor::all().map_err(|e| format!("Failed to get monitors: {}", e))?;

    if monitors.is_empty() {
        return Err("No monitors found".to_string());
    }

    let primary_monitor = &monitors[0];
    let screenshot = primary_monitor
        .capture_image()
        .map_err(|e| format!("Failed to capture screenshot: {}", e))?;

    let mut buffer = Cursor::new(Vec::new());
    screenshot
        .write_to(&mut buffer, xcap::image::ImageFormat::Png)
        .map_err(|e| format!("Failed to encode screenshot: {}", e))?;

    let base64_image = general_purpose::STANDARD.encode(buffer.into_inner());
    Ok(format!("data:image/png;base64,{}", base64_image))
}

#[tauri::command]
fn capture_screenshot(
    x: i32,
    y: i32,
    width: u32,
    height: u32,
    save_path: String,
) -> Result<String, String> {
    let monitors = Monitor::all().map_err(|e| format!("Failed to get monitors: {}", e))?;

    if monitors.is_empty() {
        return Err("No monitors found".to_string());
    }

    let primary_monitor = &monitors[0];
    let screenshot = primary_monitor
        .capture_image()
        .map_err(|e| format!("Failed to capture screenshot: {}", e))?;

    let cropped = if width > 0 && height > 0 {
        screenshot
            .view(x as u32, y as u32, width, height)
            .to_image()
    } else {
        screenshot
    };

    let path = PathBuf::from(&save_path);
    cropped
        .save(&path)
        .map_err(|e| format!("Failed to save screenshot: {}", e))?;

    Ok(save_path)
}

#[tauri::command]
fn save_base64_image(base64_data: String, save_path: String) -> Result<String, String> {
    let image_data = general_purpose::STANDARD
        .decode(&base64_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    let path = PathBuf::from(&save_path);
    std::fs::write(&path, image_data).map_err(|e| format!("Failed to save image: {}", e))?;

    Ok(save_path)
}

#[tauri::command]
fn get_settings() -> Result<Settings, String> {
    Settings::load()
}

#[tauri::command]
fn get_sftp_password() -> Result<String, String> {
    let settings = Settings::load()?;
    Ok(settings.sftp.password)
}

#[tauri::command]
fn update_settings(settings: Settings) -> Result<(), String> {
    settings.save()
}

#[tauri::command]
fn upload_to_sftp(
    file_path: String,
    filename: String,
    host: String,
    port: u16,
    username: String,
    password: String,
    remote_path: String,
) -> Result<String, String> {
    let password_opt = if password.is_empty() {
        None
    } else {
        Some(password)
    };

    let uploader = SftpUploader::new(host, port, username, password_opt, remote_path)
        .map_err(|e| e.to_string())?;

    let remote_file = uploader
        .upload_file(&file_path, &filename)
        .map_err(|e| e.to_string())?;

    Ok(remote_file)
}

#[tauri::command]
fn show_main_window(app: AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or("Main window not found")?;
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn hide_main_window(app: AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or("Main window not found")?;
    window.hide().map_err(|e| e.to_string())?;
    Ok(())
}

fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let show_i = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
    let settings_i = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &show_i,
            &PredefinedMenuItem::separator(app)?,
            &settings_i,
            &PredefinedMenuItem::separator(app)?,
            &quit_i,
        ],
    )?;

    let _ = TrayIconBuilder::with_id("main-tray")
        .menu(&menu)
        .icon(app.default_window_icon().unwrap().clone())
        .on_menu_event(move |app, event| match event.id().as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "settings" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.emit("open-settings", ());
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
        .build(app)?;

    Ok(())
}

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
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // Prevent the window from closing and hide it instead
                window.hide().unwrap();
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            capture_screenshot,
            capture_full_screenshot,
            save_base64_image,
            get_settings,
            get_sftp_password,
            update_settings,
            upload_to_sftp,
            show_main_window,
            hide_main_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
