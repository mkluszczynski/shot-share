import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Button } from "./components/ui/button";
import { RegionSelector } from "./components/RegionSelector";
import { ImageEditor } from "./components/ImageEditor";
import type { Settings } from "./types/settings";
import "./index.css"

function App() {
  const [status, setStatus] = useState("");
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [croppedImageDataUrl, setCroppedImageDataUrl] = useState<string | null>(null);

  useEffect(() => {
    // Initialize settings on app startup
    invoke<Settings>("get_settings")
      .then(settings => {
        console.log("Settings loaded:", settings);
      })
      .catch(error => {
        console.error("Failed to load settings:", error);
      });
  }, []);

  async function startScreenshot() {
    try {
      setStatus("Preparing...");
      const window = getCurrentWindow();

      await window.hide();
      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await invoke<string>("capture_full_screenshot");

      setScreenshotDataUrl(dataUrl);
      await window.setFullscreen(true);
      await window.show();
      setStatus("");
    } catch (error) {
      setStatus(`Error: ${error}`);
      const window = getCurrentWindow();
      await window.show();
    }
  }

  async function handleRegionSelected(x: number, y: number, width: number, height: number) {
    try {
      if (!screenshotDataUrl) return;

      setStatus("Cropping screenshot...");

      const croppedDataUrl = await cropImage(screenshotDataUrl, x, y, width, height);

      setScreenshotDataUrl(null);
      const window = getCurrentWindow();
      await window.setFullscreen(false);

      setCroppedImageDataUrl(croppedDataUrl);
      setStatus("");
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  }

  function cropImage(dataUrl: string, x: number, y: number, width: number, height: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject('Failed to get canvas context');
          return;
        }

        ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject('Failed to load image');
      img.src = dataUrl;
    });
  }

  async function handleEditorSave(editedImageDataUrl: string) {
    try {
      setCroppedImageDataUrl(null);
      setStatus("Saving screenshot...");

      const base64Data = editedImageDataUrl.replace(/^data:image\/png;base64,/, '');
      const savePath = `/tmp/screenshot-${Date.now()}.png`;

      const result = await invoke("save_base64_image", {
        base64Data,
        savePath
      });

      setStatus(`Screenshot saved to: ${result}`);
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  }

  function handleEditorCancel() {
    setCroppedImageDataUrl(null);
    setStatus("Screenshot cancelled");
  }

  async function handleCancel() {
    setScreenshotDataUrl(null);
    const window = getCurrentWindow();
    await window.setFullscreen(false);
    setStatus("Screenshot cancelled");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100">
      <h1 className="text-2xl font-bold">Shot Share</h1>
      <Button onClick={startScreenshot}>Take Screenshot</Button>
      {status && <p className="text-sm">{status}</p>}

      {screenshotDataUrl && (
        <RegionSelector
          screenshotDataUrl={screenshotDataUrl}
          onRegionSelected={handleRegionSelected}
          onCancel={handleCancel}
        />
      )}

      {croppedImageDataUrl && (
        <ImageEditor
          imageDataUrl={croppedImageDataUrl}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      )}
    </main>
  );
}

export default App;
