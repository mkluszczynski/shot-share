import { describe, expect, it, vi } from "vitest";
import { getCanvasDataUrl, waitForRender } from "./imageUtils";
import type Konva from "konva";

describe("getCanvasDataUrl", () => {
    it("throws when the stage is not available", () => {
        expect(() => getCanvasDataUrl(null)).toThrow("Canvas not available");
    });

    it("throws when toDataURL returns an empty string", () => {
        const stage = { toDataURL: () => "" } as unknown as Konva.Stage;
        expect(() => getCanvasDataUrl(stage)).toThrow("Failed to generate image from canvas");
    });

    it("returns the stage's data URL", () => {
        const stage = { toDataURL: () => "data:image/png;base64,abc" } as unknown as Konva.Stage;
        expect(getCanvasDataUrl(stage)).toBe("data:image/png;base64,abc");
    });
});

describe("waitForRender", () => {
    it("resolves after the given delay", async () => {
        vi.useFakeTimers();
        const promise = waitForRender(50);
        vi.advanceTimersByTime(50);
        await expect(promise).resolves.toBeUndefined();
        vi.useRealTimers();
    });
});
