use base64::{engine::general_purpose, Engine as _};
use std::io::Cursor;
use std::path::PathBuf;
use xcap::image::GenericImageView;
use xcap::Monitor;

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            capture_screenshot,
            capture_full_screenshot,
            save_base64_image
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
