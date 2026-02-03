import { Keyboard, Image, Upload, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { invoke } from "@tauri-apps/api/core";

interface HomePageProps {
    onTakeScreenshot: () => void;
}

export function HomePage({ onTakeScreenshot }: HomePageProps) {
    async function handleHideToTray() {
        try {
            await invoke("hide_main_window");
        } catch (error) {
            console.error("Failed to hide window:", error);
        }
    }

    return (
        <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Welcome Section */}
                <div className="space-y-4">
                    <h1 className="text-4xl font-bold text-gray-900">
                        Welcome to Shot Share
                    </h1>
                    <p className="text-lg text-gray-600">
                        A powerful screenshot tool with built-in editing and SFTP upload capabilities.
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold text-gray-900">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            onClick={onTakeScreenshot}
                            size="lg"
                            className="h-24 text-lg"
                        >
                            <Image className="h-6 w-6 mr-2" />
                            Take Screenshot
                        </Button>
                        <Button
                            onClick={handleHideToTray}
                            variant="outline"
                            size="lg"
                            className="h-24 text-lg"
                        >
                            Hide to Tray
                        </Button>
                    </div>
                </div>

                {/* Features Overview */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold text-gray-900">Features</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                    <Keyboard className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">
                                        Global Shortcuts
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Capture screenshots instantly from anywhere using customizable keyboard shortcuts.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                    <Image className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">
                                        Built-in Editor
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Annotate screenshots with shapes, text, arrows, blur effects, and more.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                    <Upload className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">
                                        SFTP Upload
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Automatically upload screenshots to your server via SFTP with shareable links.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                    <Settings className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">
                                        Customizable
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Configure save directories, keyboard shortcuts, and upload settings to your needs.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Getting Started */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold text-gray-900">Getting Started</h2>
                    <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                        <ol className="list-decimal list-inside space-y-2 text-gray-700">
                            <li>Configure your settings in the <strong>General Settings</strong> section</li>
                            <li>Set up SFTP upload in <strong>SFTP Upload</strong> (optional)</li>
                            <li>Press your screenshot shortcut or click <strong>Take Screenshot</strong></li>
                            <li>Select the region you want to capture</li>
                            <li>Edit your screenshot with the built-in editor</li>
                            <li>Save and automatically upload (if configured)</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}
