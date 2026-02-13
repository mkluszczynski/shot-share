import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

/**
 * Copies an image to the system clipboard
 * @param dataUrl - Base64 data URL of the image (format: "data:image/png;base64,...")
 * @throws Error if clipboard operation fails
 */
export async function copyImageToClipboard(dataUrl: string): Promise<void> {
    try {
        if (!dataUrl) {
            throw new Error("No image data provided");
        }

        toast.info("Copying to clipboard...");
        
        await invoke("copy_image_to_clipboard", { dataUrl });
        
        toast.success("Image copied to clipboard");
    } catch (error) {
        console.error("Clipboard copy error:", error);
        const message = error instanceof Error ? error.message : "Failed to copy image to clipboard";
        toast.error("Copy failed", {
            description: message
        });
        throw error;
    }
}
