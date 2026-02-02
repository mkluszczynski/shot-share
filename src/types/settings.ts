export interface SftpConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    remote_path: string;
}

export interface Settings {
    save_directory: string;
    screenshot_shortcut: string;
    sftp: SftpConfig;
}
