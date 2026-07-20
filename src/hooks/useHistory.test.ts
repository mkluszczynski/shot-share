import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useHistory } from "./useHistory";
import type { RectShape } from "../types/editor";

function rect(id: string): RectShape {
    return { id, type: "rect", x: 0, y: 0, width: 10, height: 10, stroke: "#000" };
}

describe("useHistory", () => {
    it("starts with the initial shapes and no undo/redo available", () => {
        const { result } = renderHook(() => useHistory([rect("a")]));

        expect(result.current.shapes).toEqual([rect("a")]);
        expect(result.current.canUndo).toBe(false);
        expect(result.current.canRedo).toBe(false);
    });

    it("undo/redo walk back and forward through pushed states", () => {
        const { result } = renderHook(() => useHistory([]));

        act(() => result.current.setShapes([rect("a")]));
        act(() => result.current.setShapes([rect("a"), rect("b")]));

        expect(result.current.shapes).toHaveLength(2);

        act(() => result.current.undo());
        expect(result.current.shapes).toEqual([rect("a")]);
        expect(result.current.canRedo).toBe(true);

        act(() => result.current.undo());
        expect(result.current.shapes).toEqual([]);
        expect(result.current.canUndo).toBe(false);

        act(() => result.current.redo());
        expect(result.current.shapes).toEqual([rect("a")]);
    });

    it("pushing a new state after undo discards the redo branch", () => {
        const { result } = renderHook(() => useHistory([]));

        act(() => result.current.setShapes([rect("a")]));
        act(() => result.current.setShapes([rect("a"), rect("b")]));
        act(() => result.current.undo());
        act(() => result.current.setShapes([rect("a"), rect("c")]));

        expect(result.current.canRedo).toBe(false);
        expect(result.current.shapes).toEqual([rect("a"), rect("c")]);
    });

    it("caps history at 50 entries", () => {
        const { result } = renderHook(() => useHistory([]));

        for (let i = 0; i < 60; i++) {
            act(() => result.current.setShapes([rect(`s${i}`)]));
        }

        // Should still be able to undo, but not more than the cap allows.
        let undoCount = 0;
        while (result.current.canUndo && undoCount <= 60) {
            act(() => result.current.undo());
            undoCount++;
        }

        expect(undoCount).toBeLessThanOrEqual(49);
    });
});
