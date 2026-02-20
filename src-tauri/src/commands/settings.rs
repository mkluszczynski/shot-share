use crate::services::Settings;

#[tauri::command]
pub fn get_settings() -> Result<Settings, String> {
    Settings::load()
}

#[tauri::command]
pub fn update_settings(settings: Settings, password: Option<String>) -> Result<(), String> {
    let mut settings_to_save = settings;

    if let Some(new_password) = password {
        if !new_password.is_empty() {
            println!("New password provided (length: {})", new_password.len());
            settings_to_save.sftp.password = new_password;
        }
    }

    settings_to_save.save()
}
