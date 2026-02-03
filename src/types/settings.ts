export interface SftpConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    use_ssh_key: boolean;
    remote_path: string;
    base_url: string;
    copy_to_clipboard: boolean;
}

export interface Settings {
    save_directory: string;
    screenshot_shortcut: string;
    sftp: SftpConfig;
}
