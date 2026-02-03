import { useState, useRef, MouseEvent, useEffect, KeyboardEvent } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

interface Region {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

interface RegionSelectorProps {
    screenshotDataUrl: string;
    onRegionSelected: (x: number, y: number, width: number, height: number) => void;
    onCancel: () => void;
}

export function RegionSelector({ screenshotDataUrl, onRegionSelected, onCancel }: RegionSelectorProps) {
    const [region, setRegion] = useState<Region | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);

    // Register ESC as a global shortcut when component mounts
    useEffect(() => {
        // Register global ESC shortcut
        invoke("register_escape_shortcut").catch(err => {
            console.error("Failed to register escape shortcut:", err);
        });

        // Listen for the escape event from Rust
        const unlistenEscape = listen("escape-pressed", () => {
            onCancel();
        });

        return () => {
            // Cleanup: unregister ESC shortcut when component unmounts
            invoke("unregister_escape_shortcut").catch(err => {
                console.error("Failed to unregister escape shortcut:", err);
            });
            unlistenEscape.then(fn => fn());
        };
    }, [onCancel]);

    const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        const rect = overlayRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setRegion({ startX: x, startY: y, endX: x, endY: y });
        setIsSelecting(true);
    };

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!isSelecting || !region) return;

        const rect = overlayRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setRegion({ ...region, endX: x, endY: y });
    };

    const handleMouseUp = () => {
        if (!region) return;

        setIsSelecting(false);

        const x = Math.min(region.startX, region.endX);
        const y = Math.min(region.startY, region.endY);
        const width = Math.abs(region.endX - region.startX);
        const height = Math.abs(region.endY - region.startY);

        if (width > 5 && height > 5) {
            onRegionSelected(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
        }
    };

    const getSelectionStyle = () => {
        if (!region) return {};

        const x = Math.min(region.startX, region.endX);
        const y = Math.min(region.startY, region.endY);
        const width = Math.abs(region.endX - region.startX);
        const height = Math.abs(region.endY - region.startY);

        return {
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
        };
    };

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <img
                src={screenshotDataUrl}
                alt="Screenshot"
                className="h-full w-full object-cover"
                draggable={false}
            />
            {region && (
                <div
                    className="absolute border-2 border-blue-500 bg-blue-500/20"
                    style={getSelectionStyle()}
                >
                    <div className="absolute -top-8 left-0 rounded bg-blue-500 px-2 py-1 text-xs text-white">
                        {Math.round(Math.abs(region.endX - region.startX))} x {Math.round(Math.abs(region.endY - region.startY))}
                    </div>
                </div>
            )}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded bg-white px-4 py-2 text-sm shadow-lg">
                Click and drag to select region • Press ESC to cancel
            </div>
        </div>
    );
}
