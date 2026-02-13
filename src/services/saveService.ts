import { toast } from "sonner";

/**
 * Prepares and saves the edited image
 * @param dataUrl - Base64 data URL of the image
 * @param onSave - Callback function to handle the actual save operation
 * @throws Error if save preparation fails
 */
export async function saveEditedImage(
    dataUrl: string,
    onSave: (dataUrl: string) => void
): Promise<void> {
    try {
        if (!dataUrl) {
            throw new Error("No image data to save");
        }

        toast.info("Saving image...");
        
        // Call the parent callback to handle the actual save
        onSave(dataUrl);
        
        toast.success("Image saved successfully");
    } catch (error) {
        console.error("Save error:", error);
        const message = error instanceof Error ? error.message : "Failed to save image";
        toast.error("Save failed", {
            description: message
        });
        throw error;
    }
}
