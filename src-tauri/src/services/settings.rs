use keyring::Entry;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

const KEYRING_SERVICE: &str = "shot-share";
const KEYRING_USERNAME: &str = "sftp-password";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SftpConfig {
    pub host: String,
    pub port: u16,
    pub username: String,
    #[serde(default)]
    pub password: String,
    pub remote_path: String,
    #[serde(default = "default_base_url")]
    pub base_url: String,
    #[serde(default = "default_copy_to_clipboard")]
    pub copy_to_clipboard: bool,
}

fn default_base_url() -> String {
    String::from("https://example.com")
}

fn default_copy_to_clipboard() -> bool {
    true
}

impl Default for SftpConfig {
    fn default() -> Self {
        Self {
            host: String::new(),
            port: 22,
            username: String::new(),
            password: String::new(),
            remote_path: String::from("/uploads"),
            base_url: String::from("https://example.com"),
            copy_to_clipboard: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub save_directory: String,
    pub screenshot_shortcut: String,
    #[serde(default)]
    pub filename_prefix: String,
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
            filename_prefix: String::from(""),
            sftp: SftpConfig::default(),
        }
    }
}

impl Settings {
    /// Get the keyring entry for SFTP password
    fn get_keyring_entry() -> Result<Entry, String> {
        Entry::new(KEYRING_SERVICE, KEYRING_USERNAME)
            .map_err(|e| format!("Failed to access keyring: {}", e))
    }

    /// Save SFTP password to OS keyring
    fn save_password_to_keyring(password: &str) -> Result<(), String> {
        let entry = Self::get_keyring_entry()?;
        entry
            .set_password(password)
            .map_err(|e| format!("Failed to save password to keyring: {}", e))?;

        // Immediately verify it was saved
        if let Err(e) = entry.get_password() {
            eprintln!("[save_password_to_keyring] Verification failed: {:?}", e);
        }

        Ok(())
    }

    /// Delete SFTP password from OS keyring
    fn delete_password_from_keyring() -> Result<(), String> {
        let entry = Self::get_keyring_entry()?;
        entry
            .delete_credential()
            .map_err(|e| format!("Failed to delete password from keyring: {}", e))
    }

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

    /// Ensure the save directory exists, creating it if necessary
    fn ensure_save_directory_exists(&self) -> Result<(), String> {
        let save_path = PathBuf::from(&self.save_directory);

        if !save_path.exists() {
            fs::create_dir_all(&save_path).map_err(|e| {
                format!(
                    "Failed to create save directory '{}': {}",
                    self.save_directory, e
                )
            })?;
        } else if !save_path.is_dir() {
            return Err(format!(
                "Save path '{}' exists but is not a directory",
                self.save_directory
            ));
        }

        Ok(())
    }

    /// Save settings to file
    pub fn save(&self) -> Result<(), String> {
        let settings_path = Self::settings_file_path()?;

        // Ensure save directory exists before saving settings
        self.ensure_save_directory_exists()?;

        // Save password to keyring (only if not empty)
        if !self.sftp.password.is_empty() {
            Self::save_password_to_keyring(&self.sftp.password)?;
        } else {
            // If password is empty, delete it from keyring
            let _ = Self::delete_password_from_keyring(); // Ignore errors if no password exists
        }

        let json = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Failed to serialize settings: {}", e))?;

        fs::write(&settings_path, json)
            .map_err(|e| format!("Failed to write settings file: {}", e))?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // These only exercise (de)serialization, not `load`/`save`, since those
    // touch the real filesystem and OS keyring which aren't available in CI.

    #[test]
    fn default_settings_round_trip_through_json() {
        let settings = Settings::default();
        let json = serde_json::to_string(&settings).expect("serialize");
        let parsed: Settings = serde_json::from_str(&json).expect("deserialize");

        assert_eq!(parsed.save_directory, settings.save_directory);
        assert_eq!(parsed.screenshot_shortcut, settings.screenshot_shortcut);
        assert_eq!(parsed.sftp.port, settings.sftp.port);
    }

    #[test]
    fn missing_optional_fields_fall_back_to_defaults() {
        // Simulates loading a settings.json written by an older version of
        // the app, before filename_prefix/base_url/copy_to_clipboard existed.
        let legacy_json = r#"{
            "save_directory": "/home/user/Pictures/Screenshots",
            "screenshot_shortcut": "CommandOrControl+Shift+S",
            "sftp": {
                "host": "example.com",
                "port": 22,
                "username": "user",
                "remote_path": "/uploads"
            }
        }"#;

        let settings: Settings = serde_json::from_str(legacy_json).expect("deserialize");

        assert_eq!(settings.filename_prefix, "");
        assert_eq!(settings.sftp.base_url, "https://example.com");
        assert!(settings.sftp.copy_to_clipboard);
        assert_eq!(settings.sftp.password, "");
    }
}
