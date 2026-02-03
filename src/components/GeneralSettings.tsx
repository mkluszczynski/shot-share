import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import type { Settings as SettingsType } from "../types/settings";

export function GeneralSettings() {
    const [settings, setSettings] = useState<SettingsType | null>(null);
    const [saveDirectory, setSaveDirectory] = useState("");
    const [screenshotShortcut, setScreenshotShortcut] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isCapturingShortcut, setIsCapturingShortcut] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const loadedSettings = await invoke<SettingsType>("get_settings");
            setSettings(loadedSettings);
            setSaveDirectory(loadedSettings.save_directory);
            setScreenshotShortcut(loadedSettings.screenshot_shortcut);
        } catch (error) {
            console.error("Failed to load settings:", error);
            toast.error("Failed to load settings", {
                description: String(error),
            });
        }
    }

    async function handleBrowseDirectory() {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                defaultPath: saveDirectory,
            });

            if (selected && typeof selected === "string") {
                setSaveDirectory(selected);
            }
        } catch (error) {
            console.error("Failed to browse directory:", error);
        }
    }

    function handleShortcutKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        e.preventDefault();

        if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
            return;
        }

        const modifiers: string[] = [];

        if (e.ctrlKey || e.metaKey) {
            modifiers.push("CommandOrControl");
        }
        if (e.altKey) {
            modifiers.push("Alt");
        }
        if (e.shiftKey) {
            modifiers.push("Shift");
        }

        let key = e.key;

        if (key === " ") {
            key = "Space";
        } else if (key.length === 1) {
            key = key.toUpperCase();
        }

        const shortcut = [...modifiers, key].join("+");
        setScreenshotShortcut(shortcut);
        setIsCapturingShortcut(false);
    }

    function handleShortcutInputClick() {
        setIsCapturingShortcut(true);
    }

    function handleShortcutInputBlur() {
        setIsCapturingShortcut(false);
    }

    async function handleSave() {
        if (!settings) return;

        setIsSaving(true);
        try {
            const updatedSettings: SettingsType = {
                ...settings,
                save_directory: saveDirectory,
                screenshot_shortcut: screenshotShortcut,
            };

            await invoke("update_settings", {
                settings: updatedSettings,
                password: null,
            });

            try {
                await invoke("register_shortcut", { shortcutStr: screenshotShortcut });
            } catch (error) {
                console.error("Failed to register shortcut:", error);
                toast.error("Failed to register keyboard shortcut", {
                    description: String(error),
                });
                return;
            }

            toast.success("General settings saved successfully");
            await loadSettings();
        } catch (error) {
            console.error("Failed to save settings:", error);
            toast.error("Failed to save settings", {
                description: String(error),
            });
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-2xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">General Settings</h1>
                    <p className="text-gray-600 mt-2">
                        Configure screenshot save location and keyboard shortcuts
                    </p>
                </div>

                <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
                    <div className="space-y-2">
                        <Label htmlFor="saveDirectory">Save Directory</Label>
                        <div className="flex gap-2">
                            <Input
                                id="saveDirectory"
                                value={saveDirectory}
                                onChange={(e) => setSaveDirectory(e.target.value)}
                                placeholder="/path/to/screenshots"
                            />
                            <Button onClick={handleBrowseDirectory} variant="outline">
                                Browse
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Location where screenshots will be saved by default
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="screenshotShortcut">Screenshot Shortcut</Label>
                        <Input
                            id="screenshotShortcut"
                            value={
                                isCapturingShortcut ? "Press keys..." : screenshotShortcut
                            }
                            onClick={handleShortcutInputClick}
                            onKeyDown={handleShortcutKeyDown}
                            onBlur={handleShortcutInputBlur}
                            readOnly
                            placeholder="Click and press keys"
                            className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground">
                            Click the field and press your desired key combination (e.g.,
                            Ctrl+Shift+S)
                        </p>
                    </div>

                    <div className="pt-4">
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
