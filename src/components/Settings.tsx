import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";
import type { Settings as SettingsType } from "../types/settings";

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Settings({ isOpen, onClose }: SettingsProps) {
    const [settings, setSettings] = useState<SettingsType | null>(null);
    const [saveDirectory, setSaveDirectory] = useState("");
    const [screenshotShortcut, setScreenshotShortcut] = useState("");
    const [sftpHost, setSftpHost] = useState("");
    const [sftpPort, setSftpPort] = useState(22);
    const [sftpUsername, setSftpUsername] = useState("");
    const [sftpPassword, setSftpPassword] = useState("");
    const [sftpRemotePath, setSftpRemotePath] = useState("");
    const [sftpBaseUrl, setSftpBaseUrl] = useState("");
    const [copyToClipboard, setCopyToClipboard] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isCapturingShortcut, setIsCapturingShortcut] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadSettings();
        }
    }, [isOpen]);

    async function loadSettings() {
        try {
            const loadedSettings = await invoke<SettingsType>("get_settings");
            setSettings(loadedSettings);
            setSaveDirectory(loadedSettings.save_directory);
            setScreenshotShortcut(loadedSettings.screenshot_shortcut);
            setSftpHost(loadedSettings.sftp.host);
            setSftpPort(loadedSettings.sftp.port);
            setSftpUsername(loadedSettings.sftp.username);
            setSftpPassword(loadedSettings.sftp.password);
            setSftpRemotePath(loadedSettings.sftp.remote_path);
            setSftpBaseUrl(loadedSettings.sftp.base_url);
            setCopyToClipboard(loadedSettings.sftp.copy_to_clipboard);
        } catch (error) {
            console.error("Failed to load settings:", error);
            toast.error("Failed to load settings", {
                description: String(error)
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

        // Ignore just modifier keys by themselves
        if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
            return;
        }

        const modifiers: string[] = [];

        // Add modifiers in the correct order for Tauri
        if (e.ctrlKey || e.metaKey) {
            modifiers.push('CommandOrControl');
        }
        if (e.altKey) {
            modifiers.push('Alt');
        }
        if (e.shiftKey) {
            modifiers.push('Shift');
        }

        // Get the key name
        let key = e.key;

        // Normalize key names
        if (key === ' ') {
            key = 'Space';
        } else if (key.length === 1) {
            key = key.toUpperCase();
        }

        // Build the shortcut string
        const shortcut = [...modifiers, key].join('+');
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
                save_directory: saveDirectory,
                screenshot_shortcut: screenshotShortcut,
                sftp: {
                    host: sftpHost,
                    port: sftpPort,
                    username: sftpUsername,
                    password: sftpPassword,
                    remote_path: sftpRemotePath,
                    base_url: sftpBaseUrl,
                    copy_to_clipboard: copyToClipboard,
                },
            };

            await invoke("update_settings", { settings: updatedSettings });

            // Register the new keyboard shortcut
            try {
                await invoke("register_shortcut", { shortcutStr: screenshotShortcut });
            } catch (error) {
                console.error("Failed to register shortcut:", error);
                toast.error("Failed to register keyboard shortcut", {
                    description: String(error)
                });
                return;
            }

            toast.success("Settings saved successfully");
            onClose();
        } catch (error) {
            console.error("Failed to save settings:", error);
            toast.error("Failed to save settings", {
                description: String(error)
            });
        } finally {
            setIsSaving(false);
        }
    }

    function handleCancel() {
        loadSettings();
        onClose();
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                        Configure Shot Share preferences and SFTP upload settings
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* General Settings */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">General</h3>

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
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="screenshotShortcut">Screenshot Shortcut</Label>
                            <Input
                                id="screenshotShortcut"
                                value={isCapturingShortcut ? "Press keys..." : screenshotShortcut}
                                onClick={handleShortcutInputClick}
                                onKeyDown={handleShortcutKeyDown}
                                onBlur={handleShortcutInputBlur}
                                readOnly
                                placeholder="Click and press keys"
                                className="cursor-pointer"
                            />
                            <p className="text-xs text-muted-foreground">
                                Click the field and press your desired key combination
                            </p>
                        </div>
                    </div>

                    {/* SFTP Settings */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">SFTP Upload</h3>

                        <div className="space-y-2">
                            <Label htmlFor="sftpHost">Host</Label>
                            <Input
                                id="sftpHost"
                                value={sftpHost}
                                onChange={(e) => setSftpHost(e.target.value)}
                                placeholder="example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sftpPort">Port</Label>
                            <Input
                                id="sftpPort"
                                type="number"
                                value={sftpPort}
                                onChange={(e) => setSftpPort(parseInt(e.target.value) || 22)}
                                placeholder="22"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sftpUsername">Username</Label>
                            <Input
                                id="sftpUsername"
                                value={sftpUsername}
                                onChange={(e) => setSftpUsername(e.target.value)}
                                placeholder="username"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sftpPassword">Password</Label>
                            <Input
                                id="sftpPassword"
                                type="password"
                                value={sftpPassword}
                                onChange={(e) => setSftpPassword(e.target.value)}
                                placeholder="password"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sftpRemotePath">Remote Path</Label>
                            <Input
                                id="sftpRemotePath"
                                value={sftpRemotePath}
                                onChange={(e) => setSftpRemotePath(e.target.value)}
                                placeholder="/uploads"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sftpBaseUrl">Base URL</Label>
                            <Input
                                id="sftpBaseUrl"
                                value={sftpBaseUrl}
                                onChange={(e) => setSftpBaseUrl(e.target.value)}
                                placeholder="https://example.com"
                            />
                            <p className="text-xs text-muted-foreground">
                                The public URL where uploaded files can be accessed
                            </p>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                id="copyToClipboard"
                                type="checkbox"
                                checked={copyToClipboard}
                                onChange={(e) => setCopyToClipboard(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label htmlFor="copyToClipboard" className="cursor-pointer">
                                Copy link to clipboard after upload
                            </Label>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
