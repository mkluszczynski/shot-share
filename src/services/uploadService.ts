import { invoke } from "@tauri-apps/api/core";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { toast } from "sonner";
import type { Settings } from "../types/settings";

export async function uploadImageToSftp(
    dataUrl: string,
    onComplete: () => void
): Promise<void> {
    try {
        toast.info("Loading settings...");
        const settings = await invoke<Settings>("get_settings");

        // Validate SFTP configuration
        if (!settings.sftp.host?.trim() || !settings.sftp.username?.trim()) {
            throw new Error("SFTP not configured. Please configure SFTP settings in Settings.");
        }

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `screenshot-${timestamp}.png`;

        // Save the image temporarily
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
        const tempPath = `${settings.save_directory}/${filename}`;

        toast.info("Saving image...");
        await invoke("save_base64_image", {
            base64Data,
            savePath: tempPath,
        });

        toast.info("Uploading to SFTP...");
        const remotePath = await invoke<string>("upload_to_sftp", {
            filePath: tempPath,
            filename,
            host: settings.sftp.host,
            port: settings.sftp.port,
            username: settings.sftp.username,
            password: settings.sftp.password,
            remotePath: settings.sftp.remote_path,
        });

        // Construct the public URL
        const baseUrl = settings.sftp.base_url.replace(/\/$/, "");
        const publicUrl = `${baseUrl}/${filename}`;

        // Copy to clipboard if enabled
        if (settings.sftp.copy_to_clipboard) {
            try {
                await writeText(publicUrl);
                toast.success("Uploaded! Link copied to clipboard");
            } catch (clipboardError) {
                console.error("Failed to copy to clipboard:", clipboardError);
                toast.success(`Uploaded to ${remotePath}`, {
                    description: "Clipboard copy failed"
                });
            }
        } else {
            toast.success(`Uploaded successfully to ${remotePath}`);
        }

        setTimeout(onComplete, 1500);
    } catch (error) {
        console.error("Upload error:", error);
        toast.error("Upload failed", {
            description: String(error)
        });
        throw error;
    }
}
