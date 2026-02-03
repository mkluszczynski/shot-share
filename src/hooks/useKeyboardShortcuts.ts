import { useEffect } from "react";

interface UseKeyboardShortcutsProps {
    selectedId: string | null;
    editingText: boolean;
    onDelete: () => void;
    onEscape: () => void;
}

export function useKeyboardShortcuts({
    selectedId,
    editingText,
    onDelete,
    onEscape,
}: UseKeyboardShortcutsProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (editingText) return; // Don't handle shortcuts while editing text

            if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
                onDelete();
            }

            if (e.key === "Escape") {
                onEscape();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedId, editingText, onDelete, onEscape]);
}
