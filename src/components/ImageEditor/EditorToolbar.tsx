import { Button } from "../ui/button";
import { Square, Type, MousePointer2, Upload, MoveRight, ListOrdered, Blend, Undo2, Redo2, X, Save, Copy } from "lucide-react";
import type { Tool } from "../../types/editor";

interface EditorToolbarProps {
    tool: Tool;
    color: string;
    selectedId: string | null;
    uploading: boolean;
    canUndo: boolean;
    canRedo: boolean;
    onToolChange: (tool: Tool) => void;
    onColorChange: (color: string) => void;
    onUpload: () => void;
    onCopy: () => void;
    onSave: () => void;
    onCancel: () => void;
    onUndo: () => void;
    onRedo: () => void;
}

export function EditorToolbar({
    tool,
    color,
    selectedId,
    uploading,
    canUndo,
    canRedo,
    onToolChange,
    onColorChange,
    onUpload,
    onCopy,
    onSave,
    onCancel,
    onUndo,
    onRedo,
}: EditorToolbarProps) {
    const tools = [
        { id: "select" as Tool, icon: MousePointer2, label: "Select", shortcut: "V" },
        { id: "rectangle" as Tool, icon: Square, label: "Rectangle", shortcut: "R" },
        { id: "arrow" as Tool, icon: MoveRight, label: "Arrow", shortcut: "A" },
        { id: "stepper" as Tool, icon: ListOrdered, label: "Stepper", shortcut: "N" },
        { id: "blur" as Tool, icon: Blend, label: "Blur", shortcut: "B" },
        { id: "text" as Tool, icon: Type, label: "Text", shortcut: "T" },
    ];

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
            <div className="flex items-center gap-2 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl shadow-black/20 p-3">
                {/* Undo/Redo */}
                <div className="flex items-center gap-1 pr-3 border-r border-border/50">
                    <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        className="p-2 rounded-lg hover:bg-secondary/50 disabled:opacity-30 disabled:hover:bg-transparent transition-all group cursor-pointer"
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo2 className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>
                    <button
                        onClick={onRedo}
                        disabled={!canRedo}
                        className="p-2 rounded-lg hover:bg-secondary/50 disabled:opacity-30 disabled:hover:bg-transparent transition-all group cursor-pointer"
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo2 className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>
                </div>

                {/* Tools */}
                <div className="flex items-center gap-1">
                    {tools.map((t) => {
                        const Icon = t.icon;
                        const isActive = tool === t.id;

                        return (
                            <button
                                key={t.id}
                                onClick={() => onToolChange(t.id)}
                                className={`
                                    relative p-2.5 rounded-lg transition-all duration-200 group cursor-pointer
                                    ${isActive
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                        : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
                                    }
                                `}
                                title={`${t.label} (${t.shortcut})`}
                            >
                                {isActive && (
                                    <div className="absolute inset-0 bg-linear-to-r from-primary to-primary/80 rounded-lg animate-glow" />
                                )}
                                <Icon className={`h-4 w-4 relative z-10 ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
                            </button>
                        );
                    })}
                </div>

                {/* Color Picker */}
                <div className="flex items-center gap-2 px-3 border-x border-border/50">
                    <div className="relative group">
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => onColorChange(e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border-2 border-border/50 hover:border-primary/50 transition-all"
                            title="Color"
                        />
                        <div
                            className="absolute inset-0 rounded-lg pointer-events-none ring-2 ring-transparent group-hover:ring-primary/30 transition-all"
                            style={{ backgroundColor: `${color}20` }}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 pl-3 border-l border-border/50">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onCancel}
                        className="h-9 gap-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    >
                        <X className="h-4 w-4" />
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onCopy}
                        className="h-9 gap-1.5 border-border/50 hover:border-primary/50 hover:bg-primary/5"
                    >
                        <Copy className="h-4 w-4" />
                        Copy
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onUpload}
                        disabled={uploading}
                        className="h-9 gap-1.5 border-border/50 hover:border-primary/50 hover:bg-primary/5"
                    >
                        <Upload className="h-4 w-4" />
                        {uploading ? "Uploading..." : "Upload"}
                    </Button>
                    <Button
                        size="sm"
                        onClick={onSave}
                        className="h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                    >
                        <Save className="h-4 w-4" />
                        Save
                    </Button>
                </div>

                {/* Hint */}
                {selectedId && (
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg">
                        <span className="text-xs text-muted-foreground font-mono">
                            Press <kbd className="px-1.5 py-0.5 bg-secondary/50 rounded text-foreground">Delete</kbd> to remove
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
