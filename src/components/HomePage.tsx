import { Keyboard, Image, Upload, Settings, Zap, Target, Sparkles } from "lucide-react";
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

    const features = [
        {
            id: "global-shortcuts",
            icon: Keyboard,
            title: "Global Shortcuts",
            description: "Instant capture from anywhere with customizable hotkeys",
            color: "from-cyan-500/10 to-blue-500/10 border-cyan-500/20"
        },
        {
            id: "precision-editor",
            icon: Target,
            title: "Precision Editor",
            description: "Annotate with shapes, text, arrows, blur, and numbered steps",
            color: "from-purple-500/10 to-pink-500/10 border-purple-500/20"
        },
        {
            id: "sftp-upload",
            icon: Upload,
            title: "SFTP Upload",
            description: "Auto-upload to your server with shareable links",
            color: "from-green-500/10 to-emerald-500/10 border-green-500/20"
        },
        {
            id: "customizable",
            icon: Sparkles,
            title: "Customizable",
            description: "Configure paths, shortcuts, and upload settings",
            color: "from-orange-500/10 to-amber-500/10 border-orange-500/20"
        }
    ];

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto p-8 space-y-8">
                {/* Hero Section */}
                <div className="space-y-6 animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                        <Zap className="h-3 w-3 text-primary" />
                        <span className="text-xs font-mono text-primary">Lightning Fast Screenshots</span>
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-5xl font-bold text-foreground tracking-tight">
                            Capture.<br />
                            <span className="text-primary">Edit.</span> Share.
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                            Professional screenshot tool with built-in editing and instant SFTP upload.
                            Streamline your workflow.
                        </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            onClick={onTakeScreenshot}
                            size="lg"
                            className="h-12 px-6 text-base gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 hover:scale-105"
                        >
                            <Image className="h-5 w-5" />
                            Take Screenshot
                        </Button>
                        <Button
                            onClick={handleHideToTray}
                            variant="outline"
                            size="lg"
                            className="h-12 px-6 text-base border-border hover:bg-secondary hover:border-primary/30 transition-all"
                        >
                            Hide to Tray
                        </Button>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={feature.id}
                                style={{ animationDelay: `${index * 100}ms` }}
                                className={`group p-5 rounded-xl bg-gradient-to-br ${feature.color} border backdrop-blur-sm hover:scale-[1.02] transition-all duration-300 animate-slide-up`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 bg-card/50 rounded-lg border border-border/50 group-hover:border-primary/30 transition-colors">
                                        <Icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <h3 className="font-semibold text-foreground">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Quick Start Guide */}
                <div className="p-6 rounded-xl bg-card border border-border/50 space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-6 bg-primary rounded-full" />
                        <h2 className="text-xl font-semibold text-foreground">Quick Start</h2>
                    </div>

                    <div className="grid gap-3">
                        {[
                            { num: "1", text: "Configure settings and SFTP upload (optional)" },
                            { num: "2", text: "Press Ctrl+Shift+S or click Take Screenshot" },
                            { num: "3", text: "Select region → Edit → Save or Upload" }
                        ].map((step) => (
                            <div key={step.num} className="flex items-start gap-3 group">
                                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-mono text-sm text-primary font-semibold group-hover:bg-primary/20 transition-colors">
                                    {step.num}
                                </div>
                                <p className="text-muted-foreground pt-0.5 leading-relaxed">{step.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Keyboard Shortcut Hint */}
                <div className="flex items-center justify-center gap-6 p-6 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/10">
                    <span className="text-sm text-muted-foreground font-medium">Default Shortcut:</span>
                    <div className="flex items-center gap-2">
                        {['Ctrl', 'Shift', 'S'].map((key, i, arr) => (
                            <>
                                <kbd key={key} className="px-3 py-1.5 bg-card border border-border rounded-lg font-mono text-sm text-foreground shadow-sm">
                                    {key}
                                </kbd>
                                {i < arr.length - 1 && <span className="text-muted-foreground">+</span>}
                            </>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
