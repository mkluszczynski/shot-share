import { useState, useRef } from "react";
import type { Tool, TextShape, ShapeType, TextEditingState } from "../types/editor";

interface UseTextEditingProps {
    tool: Tool;
    color: string;
    shapes: ShapeType[];
    onShapeAdd: (shape: TextShape) => void;
    onShapeUpdate: (id: string, updates: Partial<TextShape>) => void;
    onToolChange: (tool: Tool) => void;
}

export function useTextEditing({
    tool,
    color,
    shapes,
    onShapeAdd,
    onShapeUpdate,
    onToolChange
}: UseTextEditingProps) {
    const [editingText, setEditingText] = useState<TextEditingState | null>(null);
    const [textValue, setTextValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const startTextEditing = (x: number, y: number) => {
        if (tool !== "text") return;

        const id = `text-${Date.now()}`;
        setEditingText({ id, x, y, fontSize: 24 });
        setTextValue("");
        setTimeout(() => textareaRef.current?.focus(), 10);
    };

    const handleTextDblClick = (shape: TextShape) => {
        setEditingText({
            id: shape.id,
            x: shape.x,
            y: shape.y,
            fontSize: shape.fontSize
        });
        setTextValue(shape.text);
        setTimeout(() => {
            textareaRef.current?.focus();
            textareaRef.current?.select();
        }, 10);
    };

    const finishTextEditing = () => {
        if (!editingText) return;

        const trimmed = textValue.trim();
        if (trimmed) {
            const existing = shapes.find(s => s.id === editingText.id);
            if (existing && existing.type === "text") {
                onShapeUpdate(editingText.id, { text: trimmed });
            } else {
                onShapeAdd({
                    id: editingText.id,
                    type: "text",
                    x: editingText.x,
                    y: editingText.y,
                    text: trimmed,
                    fill: color,
                    fontSize: editingText.fontSize,
                });
            }
        }

        setEditingText(null);
        setTextValue("");
        onToolChange("select");
    };

    const cancelTextEditing = () => {
        setEditingText(null);
        setTextValue("");
        onToolChange("select");
    };

    const handleTextKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            cancelTextEditing();
        }
    };

    return {
        editingText,
        textValue,
        textareaRef,
        setTextValue,
        startTextEditing,
        handleTextDblClick,
        finishTextEditing,
        handleTextKeyDown,
    };
}
