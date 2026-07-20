import { useState, useCallback } from "react";
import type { ShapeType } from "../types/editor";

interface HistoryState {
    shapes: ShapeType[];
}

export function useHistory(initialShapes: ShapeType[] = []) {
    const [shapes, setShapes] = useState<ShapeType[]>(initialShapes);
    const [history, setHistory] = useState<HistoryState[]>([{ shapes: initialShapes }]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const pushToHistory = useCallback((newShapes: ShapeType[]) => {
        setHistory(prev => {
            // Remove any "future" history beyond current index
            const newHistory = prev.slice(0, historyIndex + 1);
            // Add new state
            newHistory.push({ shapes: newShapes });
            // Limit history to last 50 states to prevent memory issues
            return newHistory.slice(-50);
        });
        setHistoryIndex(prev => Math.min(prev + 1, 49));
    }, [historyIndex]);

    const updateShapes = useCallback((newShapes: ShapeType[]) => {
        setShapes(newShapes);
        pushToHistory(newShapes);
    }, [pushToHistory]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setShapes(history[newIndex].shapes);
        }
    }, [historyIndex, history]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setShapes(history[newIndex].shapes);
        }
    }, [historyIndex, history]);

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    return {
        shapes,
        setShapes: updateShapes,
        undo,
        redo,
        canUndo,
        canRedo,
    };
}
