use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SftpConfig {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub remote_path: String,
}

impl Default for SftpConfig {
    fn default() -> Self {
        Self {
            host: String::new(),
            port: 22,
            username: String::new(),
            password: String::new(),
            remote_path: String::from("/uploads"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub save_directory: String,
    pub screenshot_shortcut: String,
    pub sftp: SftpConfig,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            save_directory: dirs::picture_dir()
                .unwrap_or_else(|| PathBuf::from("."))
                .join("Screenshots")
                .to_string_lossy()
                .to_string(),
            screenshot_shortcut: String::from("CommandOrControl+Shift+S"),
            sftp: SftpConfig::default(),
        }
    }
}

impl Settings {
    /// Get the path to the settings file
    fn settings_file_path() -> Result<PathBuf, String> {
        let config_dir =
            dirs::config_dir().ok_or_else(|| "Failed to get config directory".to_string())?;

        let app_config_dir = config_dir.join("shot-share");

        // Create the directory if it doesn't exist
        if !app_config_dir.exists() {
            fs::create_dir_all(&app_config_dir)
                .map_err(|e| format!("Failed to create config directory: {}", e))?;
        }

        Ok(app_config_dir.join("settings.json"))
    }

    /// Load settings from file, or create default if file doesn't exist
    pub fn load() -> Result<Self, String> {
        let settings_path = Self::settings_file_path()?;

        if !settings_path.exists() {
            // Create default settings file
            let default_settings = Settings::default();
            default_settings.save()?;
            return Ok(default_settings);
        }

        let contents = fs::read_to_string(&settings_path)
            .map_err(|e| format!("Failed to read settings file: {}", e))?;

        let settings: Settings = serde_json::from_str(&contents)
            .map_err(|e| format!("Failed to parse settings: {}", e))?;

        Ok(settings)
    }

    /// Save settings to file
    pub fn save(&self) -> Result<(), String> {
        let settings_path = Self::settings_file_path()?;

        let json = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Failed to serialize settings: {}", e))?;

        fs::write(&settings_path, json)
            .map_err(|e| format!("Failed to write settings file: {}", e))?;

        Ok(())
    }
}
