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
    #[serde(default)]
    pub use_ssh_key: bool, // If true, use SSH agent authentication instead of password
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
            use_ssh_key: false,
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
    /// Get the keyring entry for SFTP password
    fn get_keyring_entry() -> Result<Entry, String> {
        println!(
            "Getting keyring entry: service='{}', username='{}'",
            KEYRING_SERVICE, KEYRING_USERNAME
        );
        Entry::new(KEYRING_SERVICE, KEYRING_USERNAME)
            .map_err(|e| format!("Failed to access keyring: {}", e))
    }

    /// Get SFTP password from OS keyring
    pub fn get_password_from_keyring() -> Result<String, String> {
        println!("[get_password_from_keyring] Starting password retrieval");
        let entry = Self::get_keyring_entry()?;
        match entry.get_password() {
            Ok(password) => {
                println!(
                    "[get_password_from_keyring] Password retrieved successfully (length: {})",
                    password.len()
                );
                Ok(password)
            }
            Err(keyring::Error::NoEntry) => {
                println!(
                    "[get_password_from_keyring] No password found in keyring (NoEntry error)"
                );
                Ok(String::new()) // Return empty string if no password is stored yet
            }
            Err(e) => {
                eprintln!(
                    "[get_password_from_keyring] Failed to get password from keyring: {:?}",
                    e
                );
                Err(format!("Failed to get password from keyring: {}", e))
            }
        }
    }

    /// Save SFTP password to OS keyring
    fn save_password_to_keyring(password: &str) -> Result<(), String> {
        println!(
            "[save_password_to_keyring] Starting password save (length: {})",
            password.len()
        );
        let entry = Self::get_keyring_entry()?;
        entry
            .set_password(password)
            .map_err(|e| format!("Failed to save password to keyring: {}", e))?;
        println!("[save_password_to_keyring] Password saved successfully");

        // Immediately verify it was saved
        match entry.get_password() {
            Ok(retrieved) => {
                println!(
                    "[save_password_to_keyring] Verification: password retrieved (length: {})",
                    retrieved.len()
                );
            }
            Err(e) => {
                eprintln!("[save_password_to_keyring] Verification failed: {:?}", e);
            }
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

    /// Save settings to file
    pub fn save(&self) -> Result<(), String> {
        let settings_path = Self::settings_file_path()?;

        // Save password to keyring (only if not empty)
        if !self.sftp.password.is_empty() {
            println!(
                "Saving password to keyring (length: {})",
                self.sftp.password.len()
            );
            Self::save_password_to_keyring(&self.sftp.password)?;
        } else {
            println!("Password is empty, deleting from keyring");
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
