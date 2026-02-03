import { Home, Settings, Upload, Zap } from "lucide-react";
import { cn } from "../lib/utils";

export type NavigationItem = "home" | "general" | "sftp";

interface SidebarProps {
    currentView: NavigationItem;
    onNavigate: (view: NavigationItem) => void;
}

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
    const menuItems = [
        {
            id: "home" as NavigationItem,
            label: "Home",
            icon: Home,
        },
        {
            id: "general" as NavigationItem,
            label: "General",
            icon: Settings,
        },
        {
            id: "sftp" as NavigationItem,
            label: "Upload",
            icon: Upload,
        },
    ];

    return (
        <aside className="w-56 bg-card border-r border-border h-screen flex flex-col relative overflow-hidden">
            {/* Gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10 p-5 border-b border-border/50">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground tracking-tight">
                        Shot<span className="text-primary">Share</span>
                    </h2>
                </div>
                <p className="text-xs text-muted-foreground font-mono ml-10">v1.0.0</p>
            </div>

            <nav className="flex-1 p-3 space-y-1">
                {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            style={{ animationDelay: `${index * 50}ms` }}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group relative overflow-hidden animate-slide-up",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "text-foreground/70 hover:text-foreground hover:bg-secondary/50"
                            )}
                        >
                            {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 animate-glow" />
                            )}
                            <Icon className={cn(
                                "h-4 w-4 relative z-10 transition-transform duration-200",
                                isActive ? "scale-110" : "group-hover:scale-110"
                            )} />
                            <span className="text-sm font-medium relative z-10">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="relative z-10 p-4 border-t border-border/50">
                <div className="text-center space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                        Quick Capture
                    </p>
                    <div className="flex items-center justify-center gap-1 text-xs font-mono text-primary bg-primary/5 rounded px-2 py-1 border border-primary/20">
                        <span className="opacity-60">Ctrl</span>
                        <span className="opacity-40">+</span>
                        <span className="opacity-60">Shift</span>
                        <span className="opacity-40">+</span>
                        <span className="opacity-60">S</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
