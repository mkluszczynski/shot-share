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
    const [useSshKey, setUseSshKey] = useState(false);
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
            setUseSshKey(loadedSettings.sftp.use_ssh_key || false);
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
                useSshKey: useSshKey,
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
                    use_ssh_key: useSshKey,
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
        <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-2xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">SFTP Upload Settings</h1>
                    <p className="text-gray-600 mt-2">
                        Configure automatic upload to your SFTP server
                    </p>
                </div>

                <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
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

                    <div className="flex items-center space-x-2">
                        <input
                            id="useSshKey"
                            type="checkbox"
                            checked={useSshKey}
                            onChange={(e) => setUseSshKey(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="useSshKey" className="cursor-pointer">
                            Use SSH key authentication (instead of password)
                        </Label>
                    </div>

                    {!useSshKey && (
                        <div className="space-y-2">
                            <Label htmlFor="sftpPassword">Password</Label>
                            <Input
                                id="sftpPassword"
                                type="password"
                                value={sftpPassword}
                                onChange={(e) => setSftpPassword(e.target.value)}
                                placeholder={
                                    hasExistingPassword
                                        ? "(password saved - leave blank to keep)"
                                        : "password"
                                }
                            />
                            {hasExistingPassword && (
                                <p className="text-xs text-muted-foreground">
                                    Leave blank to keep existing password
                                </p>
                            )}
                        </div>
                    )}

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

                    <div className="pt-4 flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleTestConnection}
                            disabled={isTestingConnection || !sftpHost || !sftpUsername}
                        >
                            {isTestingConnection ? "Testing..." : "Test Connection"}
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
