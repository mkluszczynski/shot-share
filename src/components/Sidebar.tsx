import { Home, Settings, Upload } from "lucide-react";
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
            label: "General Settings",
            icon: Settings,
        },
        {
            id: "sftp" as NavigationItem,
            label: "SFTP Upload",
            icon: Upload,
        },
    ];

    return (
        <aside className="w-64 bg-gray-50 border-r border-gray-200 h-screen flex flex-col">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Shot Share</h2>
                <p className="text-sm text-gray-500 mt-1">Screenshot Tool</p>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-gray-700 hover:bg-gray-100"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                    Version 1.0.0
                </p>
            </div>
        </aside>
    );
}
