use keyring::Entry;
use ssh2::Session;
use std::fs::File;
use std::io::Read;
use std::net::{TcpStream, ToSocketAddrs};
use std::path::Path;
use std::time::Duration;

const KNOWN_HOSTS_SERVICE: &str = "shot-share-known-hosts";

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
    #[error("Host key verification failed for {0}: {1}")]
    HostKeyMismatch(String, String),
}

/// Trust-on-first-use host key verification: the first time we connect to a
/// given host:port we remember its key fingerprint in the OS keyring; on
/// every later connection we require the fingerprint to match, so a server
/// swapping keys (e.g. a MITM) is rejected instead of silently accepted.
fn verify_host_key(session: &Session, host: &str, port: u16) -> Result<(), SftpError> {
    let (key_bytes, _key_type) = session.host_key().ok_or_else(|| {
        SftpError::ConnectionFailed("Server did not present a host key".to_string())
    })?;

    let digest = openssl::sha::sha256(key_bytes);
    let fingerprint = digest.iter().map(|b| format!("{:02x}", b)).collect::<String>();

    let entry = Entry::new(KNOWN_HOSTS_SERVICE, &format!("{}:{}", host, port))
        .map_err(|e| SftpError::ConnectionFailed(format!("Failed to access keyring: {}", e)))?;

    match entry.get_password() {
        Ok(stored_fingerprint) => {
            if stored_fingerprint != fingerprint {
                return Err(SftpError::HostKeyMismatch(
                    format!("{}:{}", host, port),
                    "host key does not match the one seen previously — the server may have \
                     changed or this could be a man-in-the-middle attack"
                        .to_string(),
                ));
            }
            Ok(())
        }
        Err(keyring::Error::NoEntry) => {
            // First connection to this host: trust and remember the key.
            entry
                .set_password(&fingerprint)
                .map_err(|e| SftpError::ConnectionFailed(format!("Failed to store host key: {}", e)))?;
            Ok(())
        }
        Err(e) => Err(SftpError::ConnectionFailed(format!(
            "Failed to read stored host key: {}",
            e
        ))),
    }
}

/// Join a configured remote directory with a filename into a remote path,
/// treating an empty remote_path as "upload to the SFTP root".
fn build_remote_path(remote_path: &str, filename: &str) -> String {
    if remote_path.is_empty() {
        filename.to_string()
    } else {
        format!("{}/{}", remote_path.trim_end_matches('/'), filename)
    }
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

    /// Connect, verify the host key, and authenticate. Shared by test_connection and upload_file.
    fn connect_and_authenticate(&self, timeout_ms: u32) -> Result<Session, SftpError> {
        let addr = format!("{}:{}", self.host, self.port);
        let tcp = TcpStream::connect_timeout(
            &addr
                .to_socket_addrs()
                .map_err(|e| {
                    SftpError::ConnectionFailed(format!("Invalid host/port '{}': {}", addr, e))
                })?
                .next()
                .ok_or_else(|| {
                    SftpError::ConnectionFailed(format!("Could not resolve host: {}", self.host))
                })?,
            Duration::from_secs(10),
        )
        .map_err(|e| {
            SftpError::ConnectionFailed(format!(
                "Cannot reach {}:{}. Check host and port. Error: {}",
                self.host, self.port, e
            ))
        })?;

        let mut session = Session::new().map_err(|e| SftpError::ConnectionFailed(e.to_string()))?;
        session.set_tcp_stream(tcp);
        session.set_timeout(timeout_ms);
        session
            .handshake()
            .map_err(|e| SftpError::ConnectionFailed(format!("SSH handshake failed: {}", e)))?;

        verify_host_key(&session, &self.host, self.port)?;

        // Authenticate with password
        if let Some(ref password) = self.password {
            session
                .userauth_password(&self.username, password)
                .map_err(|e| {
                    SftpError::AuthenticationFailed(format!(
                        "Password authentication failed for user '{}': {}",
                        self.username, e
                    ))
                })?;
        } else {
            return Err(SftpError::AuthenticationFailed(
                "Password is required for authentication".to_string(),
            ));
        }

        if !session.authenticated() {
            return Err(SftpError::AuthenticationFailed(
                "Authentication failed - check username and password".to_string(),
            ));
        }

        Ok(session)
    }

    /// Test connection to the SFTP server
    pub fn test_connection(&self) -> Result<(), SftpError> {
        self.connect_and_authenticate(10000)?;
        Ok(())
    }

    pub fn upload_file(
        &self,
        local_file_path: &str,
        remote_filename: &str,
    ) -> Result<String, SftpError> {
        let session = self.connect_and_authenticate(30000)?;

        // Open SFTP session
        let sftp = session
            .sftp()
            .map_err(|e| SftpError::UploadFailed(format!("Failed to start SFTP session: {}", e)))?;

        // Read the local file
        let local_path = Path::new(local_file_path);
        let mut file =
            File::open(local_path).map_err(|e| SftpError::FileReadError(e.to_string()))?;

        let mut contents = Vec::new();
        file.read_to_end(&mut contents)
            .map_err(|e| SftpError::FileReadError(e.to_string()))?;

        let remote_file_path = build_remote_path(&self.remote_path, remote_filename);

        // Upload the file
        let mut remote_file = sftp
            .create(Path::new(&remote_file_path))
            .map_err(|e| SftpError::UploadFailed(e.to_string()))?;

        std::io::copy(&mut &contents[..], &mut remote_file)
            .map_err(|e| SftpError::UploadFailed(e.to_string()))?;

        Ok(remote_file_path)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn build_remote_path_joins_dir_and_filename() {
        assert_eq!(build_remote_path("/uploads", "shot.png"), "/uploads/shot.png");
    }

    #[test]
    fn build_remote_path_trims_trailing_slash() {
        assert_eq!(build_remote_path("/uploads/", "shot.png"), "/uploads/shot.png");
    }

    #[test]
    fn build_remote_path_with_empty_dir_uses_filename_only() {
        assert_eq!(build_remote_path("", "shot.png"), "shot.png");
    }

    #[test]
    fn uploader_rejects_empty_host() {
        let result = SftpUploader::new(String::new(), 22, "user".to_string(), None, String::new());
        assert!(matches!(result, Err(SftpError::InvalidConfig(_))));
    }

    #[test]
    fn uploader_rejects_empty_username() {
        let result =
            SftpUploader::new("host".to_string(), 22, String::new(), None, String::new());
        assert!(matches!(result, Err(SftpError::InvalidConfig(_))));
    }
}
