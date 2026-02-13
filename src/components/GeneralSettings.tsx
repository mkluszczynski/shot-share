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
    const [filenamePrefix, setFilenamePrefix] = useState("");
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
            setFilenamePrefix(loadedSettings.filename_prefix || "");
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
                filename_prefix: filenamePrefix,
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
        <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto p-8 space-y-6">
                <div className="space-y-2 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-8 bg-primary rounded-full" />
                        <h1 className="text-3xl font-bold text-foreground">General Settings</h1>
                    </div>
                    <p className="text-muted-foreground ml-3">
                        Configure screenshot save location and keyboard shortcuts
                    </p>
                </div>

                <div className="space-y-5 bg-card p-6 rounded-xl border border-border/50 shadow-lg animate-slide-up">
                    <div className="space-y-3">
                        <Label htmlFor="saveDirectory" className="text-sm font-medium text-foreground">
                            Save Directory
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="saveDirectory"
                                value={saveDirectory}
                                onChange={(e) => setSaveDirectory(e.target.value)}
                                placeholder="/path/to/screenshots"
                                className="font-mono text-sm bg-background/50 border-border/50 focus:border-primary transition-all"
                            />
                            <Button
                                onClick={handleBrowseDirectory}
                                variant="outline"
                                className="shrink-0 hover:border-primary/50 hover:text-primary transition-all"
                            >
                                Browse
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Location where screenshots will be saved by default
                        </p>
                    </div>

                    <div className="h-px bg-border/50" />

                    <div className="space-y-3">
                        <Label htmlFor="screenshotShortcut" className="text-sm font-medium text-foreground">
                            Screenshot Shortcut
                        </Label>
                        <Input
                            id="screenshotShortcut"
                            value={
                                isCapturingShortcut ? "⌨️ Press keys..." : screenshotShortcut
                            }
                            onClick={handleShortcutInputClick}
                            onKeyDown={handleShortcutKeyDown}
                            onBlur={handleShortcutInputBlur}
                            readOnly
                            placeholder="Click and press keys"
                            className="cursor-pointer font-mono text-sm bg-background/50 border-border/50 focus:border-primary transition-all hover:border-primary/30"
                        />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Click the field and press your desired key combination (e.g., Ctrl+Shift+S)
                        </p>
                    </div>

                    <div className="h-px bg-border/50" />

                    <div className="space-y-3">
                        <Label htmlFor="filenamePrefix" className="text-sm font-medium text-foreground">
                            Filename Prefix
                        </Label>
                        <Input
                            id="filenamePrefix"
                            value={filenamePrefix}
                            onChange={(e) => setFilenamePrefix(e.target.value)}
                            placeholder="e.g., my_project"
                            className="font-mono text-sm bg-background/50 border-border/50 focus:border-primary transition-all"
                        />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Optional prefix for screenshot filenames (e.g., "my_prefix" → "my_prefix_screenshot_2024-01-01.png")
                        </p>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 disabled:opacity-50"
                        >
                            {isSaving ? "⏳ Saving..." : "💾 Save Changes"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
