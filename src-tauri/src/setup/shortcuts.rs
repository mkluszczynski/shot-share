use crate::services::Settings;
use std::error::Error;
use tauri::{AppHandle, Emitter};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

pub fn setup_global_shortcuts(app: &AppHandle) -> Result<(), Box<dyn Error>> {
    let settings = Settings::load()?;
    let shortcut_str = settings.screenshot_shortcut;

    if let Ok(shortcut) = shortcut_str.parse::<Shortcut>() {
        let _ = app.global_shortcut().unregister(shortcut);

        match app
            .global_shortcut()
            .on_shortcut(shortcut, move |app, _shortcut, event| {
                if event.state == ShortcutState::Pressed {
                    let _ = app.emit("show-region-selector", ());
                }
            }) {
            Ok(_) => {
                println!("Successfully registered shortcut: {}", shortcut_str);
            }
            Err(e) => {
                eprintln!(
                    "Warning: Could not register shortcut: {}. This is normal during development.",
                    e
                );
            }
        }
    }

    Ok(())
}
