import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow, PhysicalSize } from "@tauri-apps/api/window";
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

      // Reset editor state if currently open
      if (croppedImageDataUrl) {
        setCroppedImageDataUrl(null);
        await window.setFullscreen(false);
      }

      await window.hide();
      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await invoke<string>("capture_full_screenshot");

      setScreenshotDataUrl(dataUrl);
      await window.setFullscreen(true);
      await window.show();
      await window.setFocus();
      // Give a moment for focus to be set before ESC shortcut is registered
      await new Promise(resolve => setTimeout(resolve, 100));
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
      
      // Exit fullscreen and wait for it to complete
      await window.setFullscreen(false);

      // Add padding to the window size (toolbar height + bottom padding)
      const TOOLBAR_HEIGHT = 60; // Height of the editor toolbar
      const PADDING = 100; // Extra padding around the image
      const MIN_WIDTH = 820; // Minimum window width
      const MIN_HEIGHT = 460; // Minimum window height

      const newWidth = Math.max(width + PADDING, MIN_WIDTH);
      const newHeight = Math.max(height + TOOLBAR_HEIGHT + PADDING, MIN_HEIGHT);

      // Set window size to accommodate the image with padding
      await window.setSize(new PhysicalSize(newWidth, newHeight));

      // Center the window on screen
      await window.center();

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
      // Load settings to get filename prefix
      const settings = await invoke<Settings>("get_settings");
      
      const base64Data = editedImageDataUrl.replace(/^data:image\/png;base64,/, '');
      
      // Generate filename with optional prefix
      const timestamp = Date.now();
      const prefix = settings.filename_prefix ? `${settings.filename_prefix}_` : '';
      const filename = `${prefix}screenshot_${timestamp}.png`;
      const savePath = `/tmp/${filename}`;

      await invoke("save_base64_image", {
        base64Data,
        savePath
      });

      const window = getCurrentWindow();
      await window.setFullscreen(false);
      await window.hide();
      setCroppedImageDataUrl(null);

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
        return <HomePage />;
      case "general":
        return <GeneralSettings />;
      case "sftp":
        return <SftpSettings />;
      default:
        return <HomePage />;
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

      {croppedImageDataUrl && !screenshotDataUrl && (
        <ImageEditor
          imageDataUrl={croppedImageDataUrl}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      )}

      {/* Main application UI - hidden when in screenshot/editor mode */}
      {!screenshotDataUrl && !croppedImageDataUrl && (
        <div className="flex h-screen bg-background">
          <Sidebar currentView={currentView} onNavigate={setCurrentView} />
          {renderMainContent()}
        </div>
      )}

      <Toaster position="top-right" richColors closeButton />
    </>
  );
}

export default App;
