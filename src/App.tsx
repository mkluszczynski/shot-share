import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { RegionSelector } from "./components/RegionSelector";
import { ImageEditor } from "./components/ImageEditor/ImageEditor";
import { Sidebar, type NavigationItem } from "./components/Sidebar";
import { HomePage } from "./components/HomePage";
import { GeneralSettings } from "./components/GeneralSettings";
import { SftpSettings } from "./components/SftpSettings";
import { Toaster } from "sonner";
import type { Settings } from "./types/settings";
import "./index.css"

function App() {
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [croppedImageDataUrl, setCroppedImageDataUrl] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<NavigationItem>("home");

  useEffect(() => {
    // Initialize settings on app startup
    invoke<Settings>("get_settings")
      .then(settings => {
        console.log("Settings loaded:", settings);
      })
      .catch(error => {
        console.error("Failed to load settings:", error);
      });

    // Listen for tray events
    const unlistenGeneralSettings = listen("open-general-settings", () => {
      setCurrentView("general");
    });

    const unlistenUploadSettings = listen("open-upload-settings", () => {
      setCurrentView("sftp");
    });

    const unlistenAbout = listen("open-about", () => {
      setCurrentView("home");
    });

    // Listen for global shortcut to show region selector
    const unlistenShortcut = listen("show-region-selector", () => {
      startScreenshot();
    });

    // Listen for window close events to clean up state
    const unlistenClose = listen("window-close-requested", () => {
      // Reset all editor states when window is closed via system X
      setCroppedImageDataUrl(null);
      setScreenshotDataUrl(null);
    });

    return () => {
      unlistenGeneralSettings.then(fn => fn());
      unlistenUploadSettings.then(fn => fn());
      unlistenAbout.then(fn => fn());
      unlistenShortcut.then(fn => fn());
      unlistenClose.then(fn => fn());
    };
  }, []);

  async function startScreenshot() {
    try {
      const window = getCurrentWindow();

      await window.hide();
      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await invoke<string>("capture_full_screenshot");

      setScreenshotDataUrl(dataUrl);
      await window.setFullscreen(true);
      await window.show();
      await window.setFocus();
    } catch (error) {
      console.error("Screenshot error:", error);
      const window = getCurrentWindow();
      await window.show();
    }
  }

  async function handleRegionSelected(x: number, y: number, width: number, height: number) {
    try {
      if (!screenshotDataUrl) return;

      const croppedDataUrl = await cropImage(screenshotDataUrl, x, y, width, height);

      setScreenshotDataUrl(null);
      const window = getCurrentWindow();
      await window.setFullscreen(false);

      setCroppedImageDataUrl(croppedDataUrl);
    } catch (error) {
      console.error("Crop error:", error);
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

      const base64Data = editedImageDataUrl.replace(/^data:image\/png;base64,/, '');
      const savePath = `/tmp/screenshot-${Date.now()}.png`;

      await invoke("save_base64_image", {
        base64Data,
        savePath
      });
    } catch (error) {
      console.error("Save error:", error);
    }
  }

  async function handleEditorCancel() {
    const window = getCurrentWindow();
    await window.hide();
    setCroppedImageDataUrl(null);
  }

  async function handleCancel() {
    const window = getCurrentWindow();
    await window.setFullscreen(false);
    await window.hide();
    setScreenshotDataUrl(null);
  }

  function renderMainContent() {
    switch (currentView) {
      case "home":
        return <HomePage onTakeScreenshot={startScreenshot} />;
      case "general":
        return <GeneralSettings />;
      case "sftp":
        return <SftpSettings />;
      default:
        return <HomePage onTakeScreenshot={startScreenshot} />;
    }
  }

  return (
    <>
      {/* Screenshot capture and editor overlays */}
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

      {/* Main application UI */}
      <div className="flex h-screen bg-gray-100">
        <Sidebar currentView={currentView} onNavigate={setCurrentView} />
        {renderMainContent()}
      </div>

      <Toaster position="bottom-right" richColors closeButton />
    </>
  );
}

export default App;
