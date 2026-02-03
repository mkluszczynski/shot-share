use ssh2::Session;
use std::fs::File;
use std::io::Read;
use std::net::TcpStream;
use std::path::Path;

#[derive(Debug, thiserror::Error)]
pub enum SftpError {
    #[error("Failed to connect to SFTP server: {0}")]
    ConnectionFailed(String),
    #[error("Authentication failed: {0}")]
    AuthenticationFailed(String),
    #[error("Failed to read file: {0}")]
    FileReadError(String),
    #[error("Failed to upload file: {0}")]
    UploadFailed(String),
    #[error("Invalid configuration: {0}")]
    InvalidConfig(String),
}

pub struct SftpUploader {
    host: String,
    port: u16,
    username: String,
    password: Option<String>,
    remote_path: String,
}

impl SftpUploader {
    pub fn new(
        host: String,
        port: u16,
        username: String,
        password: Option<String>,
        remote_path: String,
    ) -> Result<Self, SftpError> {
        if host.is_empty() {
            return Err(SftpError::InvalidConfig("Host cannot be empty".to_string()));
        }
        if username.is_empty() {
            return Err(SftpError::InvalidConfig(
                "Username cannot be empty".to_string(),
            ));
        }

        Ok(Self {
            host,
            port,
            username,
            password,
            remote_path,
        })
    }

    pub fn upload_file(
        &self,
        local_file_path: &str,
        remote_filename: &str,
    ) -> Result<String, SftpError> {
        // Connect to the SSH server
        let tcp = TcpStream::connect(format!("{}:{}", self.host, self.port))
            .map_err(|e| SftpError::ConnectionFailed(e.to_string()))?;

        let mut session = Session::new().map_err(|e| SftpError::ConnectionFailed(e.to_string()))?;

        session.set_tcp_stream(tcp);
        session
            .handshake()
            .map_err(|e| SftpError::ConnectionFailed(e.to_string()))?;

        // Authenticate
        if let Some(ref password) = self.password {
            session
                .userauth_password(&self.username, password)
                .map_err(|e| SftpError::AuthenticationFailed(e.to_string()))?;
        } else {
            // Try agent authentication
            session
                .userauth_agent(&self.username)
                .map_err(|e| SftpError::AuthenticationFailed(e.to_string()))?;
        }

        if !session.authenticated() {
            return Err(SftpError::AuthenticationFailed(
                "Failed to authenticate".to_string(),
            ));
        }

        // Open SFTP session
        let sftp = session
            .sftp()
            .map_err(|e| SftpError::UploadFailed(e.to_string()))?;

        // Read the local file
        let local_path = Path::new(local_file_path);
        let mut file =
            File::open(local_path).map_err(|e| SftpError::FileReadError(e.to_string()))?;

        let mut contents = Vec::new();
        file.read_to_end(&mut contents)
            .map_err(|e| SftpError::FileReadError(e.to_string()))?;

        // Construct the remote file path
        let remote_file_path = if self.remote_path.is_empty() {
            remote_filename.to_string()
        } else {
            format!(
                "{}/{}",
                self.remote_path.trim_end_matches('/'),
                remote_filename
            )
        };

        // Upload the file
        let mut remote_file = sftp
            .create(Path::new(&remote_file_path))
            .map_err(|e| SftpError::UploadFailed(e.to_string()))?;

        std::io::copy(&mut &contents[..], &mut remote_file)
            .map_err(|e| SftpError::UploadFailed(e.to_string()))?;

        Ok(remote_file_path)
    }
}
