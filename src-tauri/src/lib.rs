use base64::{engine::general_purpose, Engine as _};
use std::io::Cursor;
use std::path::PathBuf;
use tauri::image::Image;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use xcap::image::{GenericImageView, ImageReader};
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
    
    // Ensure parent directory exists
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory '{}': {}", parent.display(), e))?;
    }
    
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
    
    // Ensure parent directory exists
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory '{}': {}", parent.display(), e))?;
    }
    
    std::fs::write(&path, image_data).map_err(|e| format!("Failed to save image: {}", e))?;

    Ok(save_path)
}

#[tauri::command]
fn get_settings() -> Result<Settings, String> {
    Settings::load()
}

#[tauri::command]
fn test_sftp_connection(
    host: String,
    port: u16,
    username: String,
    password: String,
) -> Result<String, String> {
    let password_opt = if password.is_empty() {
        None
    } else {
        Some(password)
    };

    let uploader = SftpUploader::new(
        host.clone(),
        port,
        username.clone(),
        password_opt,
        String::new(), // remote_path not needed for test
    )
    .map_err(|e| e.to_string())?;

    uploader.test_connection().map_err(|e| e.to_string())?;

    Ok(format!(
        "Successfully connected to {}@{}:{}",
        username, host, port
    ))
}

#[tauri::command]
fn update_settings(settings: Settings, password: Option<String>) -> Result<(), String> {
    let mut settings_to_save = settings;

    // Handle password update - if password param provided and not empty, use it
    if let Some(new_password) = password {
        if !new_password.is_empty() {
            println!("New password provided (length: {})", new_password.len());
            settings_to_save.sftp.password = new_password;
        }
        // If empty, keep whatever is in settings (could be existing password)
    }

    settings_to_save.save()
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
    // Validate configuration before attempting connection
    println!(
        "Upload SFTP - host: '{}', username: '{}', password length: {}",
        host,
        username,
        password.len()
    );

    if host.trim().is_empty() {
        return Err(
            "SFTP host is not configured. Please configure SFTP settings first.".to_string(),
        );
    }
    if username.trim().is_empty() {
        return Err(
            "SFTP username is not configured. Please configure SFTP settings first.".to_string(),
        );
    }
    if password.trim().is_empty() {
        return Err(
            "SFTP password is not configured. Please configure SFTP settings first.".to_string(),
        );
    }

    let password_opt = Some(password);
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

fn setup_global_shortcuts(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let settings = Settings::load()?;
    let shortcut_str = settings.screenshot_shortcut;

    // Parse the shortcut string (e.g., "CommandOrControl+Shift+S")
    if let Ok(shortcut) = shortcut_str.parse::<Shortcut>() {
        // First unregister if it exists (handles hot-reload scenarios)
        let _ = app.global_shortcut().unregister(shortcut);

        // Register the shortcut with event handler
        // Note: on_shortcut both registers the shortcut AND sets up the handler
        match app
            .global_shortcut()
            .on_shortcut(shortcut, move |app, _shortcut, event| {
                if event.state == ShortcutState::Pressed {
                    // Emit event to show region selector
                    let _ = app.emit("show-region-selector", ());
                }
            }) {
            Ok(_) => {
                println!("Successfully registered shortcut: {}", shortcut_str);
            }
            Err(e) => {
                // Log but don't fail - shortcut might already be registered from previous run
                eprintln!(
                    "Warning: Could not register shortcut: {}. This is normal during development.",
                    e
                );
            }
        }
    }

    Ok(())
}

#[tauri::command]
fn register_shortcut(app: AppHandle, shortcut_str: String) -> Result<(), String> {
    // Unregister all existing shortcuts first
    app.global_shortcut()
        .unregister_all()
        .map_err(|e| format!("Failed to unregister shortcuts: {}", e))?;

    // Parse and register the new shortcut
    let shortcut = shortcut_str
        .parse::<Shortcut>()
        .map_err(|e| format!("Invalid shortcut format: {}", e))?;

    // on_shortcut both registers the shortcut AND sets up the handler in one call
    app.global_shortcut()
        .on_shortcut(shortcut, move |app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                let _ = app.emit("show-region-selector", ());
            }
        })
        .map_err(|e| format!("Failed to register shortcut: {}", e))?;

    Ok(())
}

#[tauri::command]
fn register_escape_shortcut(app: AppHandle) -> Result<(), String> {
    let shortcut = "Escape"
        .parse::<Shortcut>()
        .map_err(|e| format!("Failed to parse Escape shortcut: {}", e))?;

    app.global_shortcut()
        .on_shortcut(shortcut, move |app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                let _ = app.emit("escape-pressed", ());
            }
        })
        .map_err(|e| format!("Failed to register Escape shortcut: {}", e))?;

    Ok(())
}

#[tauri::command]
fn unregister_escape_shortcut(app: AppHandle) -> Result<(), String> {
    let shortcut = "Escape"
        .parse::<Shortcut>()
        .map_err(|e| format!("Failed to parse Escape shortcut: {}", e))?;

    app.global_shortcut()
        .unregister(shortcut)
        .map_err(|e| format!("Failed to unregister Escape shortcut: {}", e))?;

    Ok(())
}

#[tauri::command]
async fn copy_image_to_clipboard(app: AppHandle, data_url: String) -> Result<(), String> {
    // Extract base64 data from data URL (format: "data:image/png;base64,...")
    let base64_data = data_url
        .split(',')
        .nth(1)
        .ok_or("Invalid data URL format")?;

    // Decode base64 to bytes
    let image_bytes = general_purpose::STANDARD
        .decode(base64_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    // Load image to get dimensions
    let img = ImageReader::new(Cursor::new(&image_bytes))
        .with_guessed_format()
        .map_err(|e| format!("Failed to read image format: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode image: {}", e))?;

    let (width, height) = img.dimensions();
    let rgba = img.to_rgba8().into_raw();

    // Create Tauri Image
    let image = Image::new_owned(rgba, width, height);

    // Write to clipboard using the plugin
    app.clipboard()
        .write_image(&image)
        .map_err(|e| format!("Failed to write image to clipboard: {}", e))?;

    Ok(())
}

fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let take_screenshot_i = MenuItem::with_id(
        app,
        "take-screenshot",
        "Take Screenshot",
        true,
        None::<&str>,
    )?;
    let general_settings_i = MenuItem::with_id(
        app,
        "general-settings",
        "General Settings",
        true,
        None::<&str>,
    )?;
    let upload_settings_i = MenuItem::with_id(
        app,
        "upload-settings",
        "Upload Settings",
        true,
        None::<&str>,
    )?;
    let about_i = MenuItem::with_id(app, "about", "About", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &take_screenshot_i,
            &PredefinedMenuItem::separator(app)?,
            &general_settings_i,
            &upload_settings_i,
            &PredefinedMenuItem::separator(app)?,
            &about_i,
            &PredefinedMenuItem::separator(app)?,
            &quit_i,
        ],
    )?;

    // Load high-resolution tray icon (embedded at compile time)
    let icon_bytes = include_bytes!("../icons/developer-art/tray.png");
    let img = ImageReader::new(Cursor::new(icon_bytes))
        .with_guessed_format()?
        .decode()?;
    let (width, height) = img.dimensions();
    let rgba = img.to_rgba8().into_raw();
    let icon = Image::new_owned(rgba, width, height);

    let _ = TrayIconBuilder::with_id("main-tray")
        .menu(&menu)
        .icon(icon)
        .on_menu_event(move |app, event| match event.id().as_ref() {
            "take-screenshot" => {
                let _ = app.emit("show-region-selector", ());
            }
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "general-settings" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.emit("open-general-settings", ());
                }
            }
            "upload-settings" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.emit("open-upload-settings", ());
                }
            }
            "about" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.emit("open-about", ());
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
            setup_global_shortcuts(app.handle())?;
            Ok(())
        })
        .on_window_event(|window, event| {
            match event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    // Emit event to frontend to clean up state before hiding
                    let _ = window.emit("window-close-requested", ());
                    // Prevent the window from closing and hide it instead
                    window.hide().unwrap();
                    api.prevent_close();
                }
                tauri::WindowEvent::Focused(false) => {
                    // Prevent window from auto-hiding when it loses focus (e.g., Alt+Tab)
                    // This fixes bug #003 where the window disappears when losing focus
                    // Note: We intentionally do nothing here to keep the window visible
                }
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
