import Konva from "konva";

/**
 * Extracts a data URL from a Konva stage
 * @param stage - The Konva stage to export
 * @returns Base64 data URL of the canvas content
 * @throws Error if stage is not available or export fails
 */
export function getCanvasDataUrl(stage: Konva.Stage | null): string {
    if (!stage) {
        throw new Error("Canvas not available");
    }

    const dataUrl = stage.toDataURL();
    
    if (!dataUrl) {
        throw new Error("Failed to generate image from canvas");
    }

    return dataUrl;
}

/**
 * Waits for a specified duration (for allowing UI updates like clearing selection)
 * @param ms - Milliseconds to wait (default: 50ms)
 */
export function waitForRender(ms: number = 50): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
