import { useEffect } from "react";

interface UseKeyboardShortcutsProps {
    selectedId: string | null;
    editingText: boolean;
    onDelete: () => void;
    onEscape: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
}

export function useKeyboardShortcuts({
    selectedId,
    editingText,
    onDelete,
    onEscape,
    onUndo,
    onRedo,
}: UseKeyboardShortcutsProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (editingText) return; // Don't handle shortcuts while editing text

            // Undo: Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
            if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey && onUndo) {
                e.preventDefault();
                onUndo();
                return;
            }

            // Redo: Ctrl+Y (Windows/Linux) or Ctrl+Shift+Z or Cmd+Shift+Z (Mac)
            if (onRedo) {
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") {
                    e.preventDefault();
                    onRedo();
                    return;
                }
                if (e.ctrlKey && e.key === "y") {
                    e.preventDefault();
                    onRedo();
                    return;
                }
            }

            if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
                onDelete();
            }

            if (e.key === "Escape") {
                onEscape();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedId, editingText, onDelete, onEscape, onUndo, onRedo]);
}
