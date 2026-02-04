import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import type { Settings as SettingsType } from "../types/settings";

export function SftpSettings() {
    const [settings, setSettings] = useState<SettingsType | null>(null);
    const [sftpHost, setSftpHost] = useState("");
    const [sftpPort, setSftpPort] = useState(22);
    const [sftpUsername, setSftpUsername] = useState("");
    const [sftpPassword, setSftpPassword] = useState("");
    const [sftpRemotePath, setSftpRemotePath] = useState("");
    const [sftpBaseUrl, setSftpBaseUrl] = useState("");
    const [copyToClipboard, setCopyToClipboard] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [hasExistingPassword, setHasExistingPassword] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const loadedSettings = await invoke<SettingsType>("get_settings");

            setSettings(loadedSettings);
            setSftpHost(loadedSettings.sftp.host);
            setSftpPort(loadedSettings.sftp.port);
            setSftpUsername(loadedSettings.sftp.username);
            setSftpPassword("");
            setHasExistingPassword(loadedSettings.sftp.password.length > 0);
            setSftpRemotePath(loadedSettings.sftp.remote_path);
            setSftpBaseUrl(loadedSettings.sftp.base_url);
            setCopyToClipboard(loadedSettings.sftp.copy_to_clipboard);
        } catch (error) {
            console.error("Failed to load settings:", error);
            toast.error("Failed to load settings", {
                description: String(error),
            });
        }
    }

    async function handleTestConnection() {
        setIsTestingConnection(true);
        try {
            const result = await invoke<string>("test_sftp_connection", {
                host: sftpHost,
                port: sftpPort,
                username: sftpUsername,
                password: sftpPassword,
            });
            toast.success("Connection successful!", {
                description: result,
            });
        } catch (error) {
            console.error("Connection test failed:", error);
            toast.error("Connection failed", {
                description: String(error),
            });
        } finally {
            setIsTestingConnection(false);
        }
    }

    async function handleSave() {
        if (!settings) return;

        setIsSaving(true);
        try {
            const updatedSettings: SettingsType = {
                ...settings,
                sftp: {
                    host: sftpHost,
                    port: sftpPort,
                    username: sftpUsername,
                    password: "",
                    remote_path: sftpRemotePath,
                    base_url: sftpBaseUrl,
                    copy_to_clipboard: copyToClipboard,
                },
            };

            await invoke("update_settings", {
                settings: updatedSettings,
                password: sftpPassword || null,
            });

            toast.success("SFTP settings saved successfully");
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
                        <h1 className="text-3xl font-bold text-foreground">SFTP Upload</h1>
                    </div>
                    <p className="text-muted-foreground ml-3">
                        Configure automatic upload to your SFTP server
                    </p>
                </div>

                <div className="space-y-5 bg-card p-6 rounded-xl border border-border/50 shadow-lg animate-slide-up">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-3">
                            <Label htmlFor="sftpHost" className="text-sm font-medium text-foreground">Host</Label>
                            <Input
                                id="sftpHost"
                                value={sftpHost}
                                onChange={(e) => setSftpHost(e.target.value)}
                                placeholder="example.com"
                                className="font-mono text-sm bg-background/50 border-border/50 focus:border-primary transition-all"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="sftpPort" className="text-sm font-medium text-foreground">Port</Label>
                            <Input
                                id="sftpPort"
                                type="number"
                                value={sftpPort}
                                onChange={(e) => setSftpPort(parseInt(e.target.value) || 22)}
                                placeholder="22"
                                className="font-mono text-sm bg-background/50 border-border/50 focus:border-primary transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="sftpUsername" className="text-sm font-medium text-foreground">Username</Label>
                        <Input
                            id="sftpUsername"
                            value={sftpUsername}
                            onChange={(e) => setSftpUsername(e.target.value)}
                            placeholder="username"
                            className="font-mono text-sm bg-background/50 border-border/50 focus:border-primary transition-all"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="sftpPassword" className="text-sm font-medium text-foreground">Password</Label>
                        <Input
                            id="sftpPassword"
                            type="password"
                            value={sftpPassword}
                            onChange={(e) => setSftpPassword(e.target.value)}
                            placeholder={
                                hasExistingPassword
                                    ? "🔒 (password saved - leave blank to keep)"
                                    : "Enter password"
                            }
                            className="font-mono text-sm bg-background/50 border-border/50 focus:border-primary transition-all"
                        />
                        {hasExistingPassword && (
                            <p className="text-xs text-primary/70 leading-relaxed">
                                ✓ Password saved. Leave blank to keep existing password
                            </p>
                        )}
                    </div>

                    <div className="h-px bg-border/50" />

                    <div className="space-y-3">
                        <Label htmlFor="sftpRemotePath" className="text-sm font-medium text-foreground">Remote Path</Label>
                        <Input
                            id="sftpRemotePath"
                            value={sftpRemotePath}
                            onChange={(e) => setSftpRemotePath(e.target.value)}
                            placeholder="/uploads"
                            className="font-mono text-sm bg-background/50 border-border/50 focus:border-primary transition-all"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="sftpBaseUrl" className="text-sm font-medium text-foreground">Base URL</Label>
                        <Input
                            id="sftpBaseUrl"
                            value={sftpBaseUrl}
                            onChange={(e) => setSftpBaseUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="font-mono text-sm bg-background/50 border-border/50 focus:border-primary transition-all"
                        />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            The public URL where uploaded files can be accessed
                        </p>
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-background/30 border border-border/30 hover:border-primary/30 transition-all">
                        <input
                            id="copyToClipboard"
                            type="checkbox"
                            checked={copyToClipboard}
                            onChange={(e) => setCopyToClipboard(e.target.checked)}
                            className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                        />
                        <Label htmlFor="copyToClipboard" className="cursor-pointer text-sm text-foreground">
                            Copy link to clipboard after upload
                        </Label>
                    </div>

                    <div className="pt-4 flex gap-3 justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleTestConnection}
                            disabled={isTestingConnection || !sftpHost || !sftpUsername}
                            className="hover:border-primary/50 hover:text-primary transition-all disabled:opacity-50"
                        >
                            {isTestingConnection ? "⏳ Testing..." : "🔌 Test Connection"}
                        </Button>
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
