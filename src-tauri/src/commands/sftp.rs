use crate::services::SftpUploader;

#[tauri::command]
pub fn test_sftp_connection(
    host: String,
    port: u16,
    username: String,
    password: String,
) -> Result<String, String> {
    let password_opt = if password.is_empty() {
        None
    } else {
        Some(password)
    };

    let uploader = SftpUploader::new(
        host.clone(),
        port,
        username.clone(),
        password_opt,
        String::new(),
    )
    .map_err(|e| e.to_string())?;

    uploader.test_connection().map_err(|e| e.to_string())?;

    Ok(format!(
        "Successfully connected to {}@{}:{}",
        username, host, port
    ))
}

#[tauri::command]
pub fn upload_to_sftp(
    file_path: String,
    filename: String,
    host: String,
    port: u16,
    username: String,
    password: String,
    remote_path: String,
) -> Result<String, String> {
    println!(
        "Upload SFTP - host: '{}', username: '{}', password length: {}",
        host,
        username,
        password.len()
    );

    if host.trim().is_empty() {
        return Err(
            "SFTP host is not configured. Please configure SFTP settings first.".to_string(),
        );
    }
    if username.trim().is_empty() {
        return Err(
            "SFTP username is not configured. Please configure SFTP settings first.".to_string(),
        );
    }
    if password.trim().is_empty() {
        return Err(
            "SFTP password is not configured. Please configure SFTP settings first.".to_string(),
        );
    }

    let password_opt = Some(password);
    let uploader = SftpUploader::new(host, port, username, password_opt, remote_path)
        .map_err(|e| e.to_string())?;

    let remote_file = uploader
        .upload_file(&file_path, &filename)
        .map_err(|e| e.to_string())?;

    Ok(remote_file)
}
