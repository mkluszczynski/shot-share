use crate::services::Settings;
use std::path::PathBuf;

/// Restrict where the frontend is allowed to write files to: the user's
/// configured save directory, the OS pictures directory, or the OS temp
/// directory. Rejects paths (e.g. via `..`) that resolve outside those roots.
pub fn validate_save_path(save_path: &str) -> Result<PathBuf, String> {
    let path = PathBuf::from(save_path);
    if !path.is_absolute() {
        return Err("Save path must be an absolute path".to_string());
    }

    let parent = path
        .parent()
        .ok_or_else(|| "Save path has no parent directory".to_string())?;
    std::fs::create_dir_all(parent)
        .map_err(|e| format!("Failed to create directory '{}': {}", parent.display(), e))?;
    let canonical_parent = parent
        .canonicalize()
        .map_err(|e| format!("Failed to resolve path '{}': {}", parent.display(), e))?;

    let settings = Settings::load().unwrap_or_default();
    let mut allowed_roots = vec![std::env::temp_dir()];
    if let Some(pictures_dir) = dirs::picture_dir() {
        allowed_roots.push(pictures_dir);
    }
    let save_dir = PathBuf::from(&settings.save_directory);
    let _ = std::fs::create_dir_all(&save_dir);
    if let Ok(canonical_save_dir) = save_dir.canonicalize() {
        allowed_roots.push(canonical_save_dir);
    }

    if allowed_roots.iter().any(|root| canonical_parent.starts_with(root)) {
        Ok(path)
    } else {
        Err(format!(
            "Save path '{}' is outside allowed directories",
            path.display()
        ))
    }
}
