use std::error::Error;
use std::io::Cursor;
use tauri::image::Image;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager};
use xcap::image::{GenericImageView, ImageReader};

pub fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn Error>> {
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

    let icon_bytes = include_bytes!("../../icons/developer-art/tray.png");
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
