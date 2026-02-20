use base64::{engine::general_purpose, Engine as _};
use std::io::Cursor;
use tauri::image::Image;
use tauri::AppHandle;
use tauri_plugin_clipboard_manager::ClipboardExt;
use xcap::image::{GenericImageView, ImageReader};

#[tauri::command]
pub async fn copy_image_to_clipboard(app: AppHandle, data_url: String) -> Result<(), String> {
    let base64_data = data_url
        .split(',')
        .nth(1)
        .ok_or("Invalid data URL format")?;

    let image_bytes = general_purpose::STANDARD
        .decode(base64_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    let img = ImageReader::new(Cursor::new(&image_bytes))
        .with_guessed_format()
        .map_err(|e| format!("Failed to read image format: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode image: {}", e))?;

    let (width, height) = img.dimensions();
    let rgba = img.to_rgba8().into_raw();

    let image = Image::new_owned(rgba, width, height);

    app.clipboard()
        .write_image(&image)
        .map_err(|e| format!("Failed to write image to clipboard: {}", e))?;

    Ok(())
}
