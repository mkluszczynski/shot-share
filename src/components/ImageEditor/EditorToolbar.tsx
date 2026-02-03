import { Button } from "../ui/button";
import { Square, Type, MousePointer2, Upload, MoveRight, ListOrdered, Blend, Undo2, Redo2 } from "lucide-react";
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
    onSave,
    onCancel,
    onUndo,
    onRedo,
}: EditorToolbarProps) {
    return (
        <div className="bg-gray-800 border-b border-gray-700">
            <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onUndo}
                        disabled={!canUndo}
                        className="gap-1"
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo2 className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onRedo}
                        disabled={!canRedo}
                        className="gap-1"
                        title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
                    >
                        <Redo2 className="h-4 w-4" />
                    </Button>

                    <div className="w-px h-6 bg-gray-600 mx-1" />

                    <Button
                        size="sm"
                        variant={tool === "select" ? "default" : "outline"}
                        onClick={() => onToolChange("select")}
                        className="gap-2"
                    >
                        <MousePointer2 className="h-4 w-4" />
                        Select
                    </Button>
                    <Button
                        size="sm"
                        variant={tool === "rectangle" ? "default" : "outline"}
                        onClick={() => onToolChange("rectangle")}
                        className="gap-2"
                    >
                        <Square className="h-4 w-4" />
                        Rectangle
                    </Button>
                    <Button
                        size="sm"
                        variant={tool === "arrow" ? "default" : "outline"}
                        onClick={() => onToolChange("arrow")}
                        className="gap-2"
                    >
                        <MoveRight className="h-4 w-4" />
                        Arrow
                    </Button>
                    <Button
                        size="sm"
                        variant={tool === "stepper" ? "default" : "outline"}
                        onClick={() => onToolChange("stepper")}
                        className="gap-2"
                    >
                        <ListOrdered className="h-4 w-4" />
                        Stepper
                    </Button>
                    <Button
                        size="sm"
                        variant={tool === "blur" ? "default" : "outline"}
                        onClick={() => onToolChange("blur")}
                        className="gap-2"
                    >
                        <Blend className="h-4 w-4" />
                        Blur
                    </Button>
                    <Button
                        size="sm"
                        variant={tool === "text" ? "default" : "outline"}
                        onClick={() => onToolChange("text")}
                        className="gap-2"
                    >
                        <Type className="h-4 w-4" />
                        Text
                    </Button>

                    <div className="ml-4 flex items-center gap-2">
                        <label className="text-sm text-gray-300">Color:</label>
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => onColorChange(e.target.value)}
                            className="h-8 w-16 cursor-pointer rounded border-0"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {selectedId && (
                        <span className="text-xs text-gray-400 mr-2">
                            Press Delete to remove
                        </span>
                    )}
                    <Button size="sm" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onUpload}
                        disabled={uploading}
                        className="gap-2"
                    >
                        <Upload className="h-4 w-4" />
                        {uploading ? "Uploading..." : "Upload"}
                    </Button>
                    <Button size="sm" onClick={onSave}>
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
}
