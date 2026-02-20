pub mod clipboard;
pub mod greet;
pub mod screenshot;
pub mod settings;
pub mod sftp;
pub mod shortcut;
pub mod window;

pub use clipboard::copy_image_to_clipboard;
pub use greet::greet;
pub use screenshot::{capture_full_screenshot, capture_screenshot, save_base64_image};
pub use settings::{get_settings, update_settings};
pub use sftp::{test_sftp_connection, upload_to_sftp};
pub use shortcut::{register_escape_shortcut, register_shortcut, unregister_escape_shortcut};
pub use window::{hide_main_window, show_main_window};
