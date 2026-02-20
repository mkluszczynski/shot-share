use tauri::{AppHandle, Emitter};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

#[tauri::command]
pub fn register_shortcut(app: AppHandle, shortcut_str: String) -> Result<(), String> {
    app.global_shortcut()
        .unregister_all()
        .map_err(|e| format!("Failed to unregister shortcuts: {}", e))?;

    let shortcut = shortcut_str
        .parse::<Shortcut>()
        .map_err(|e| format!("Invalid shortcut format: {}", e))?;

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
pub fn register_escape_shortcut(app: AppHandle) -> Result<(), String> {
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
pub fn unregister_escape_shortcut(app: AppHandle) -> Result<(), String> {
    let shortcut = "Escape"
        .parse::<Shortcut>()
        .map_err(|e| format!("Failed to parse Escape shortcut: {}", e))?;

    app.global_shortcut()
        .unregister(shortcut)
        .map_err(|e| format!("Failed to unregister Escape shortcut: {}", e))?;

    Ok(())
}
