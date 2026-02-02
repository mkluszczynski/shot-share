import { useState, useRef, MouseEvent } from "react";

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

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
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
            onKeyDown={(e) => handleKeyDown(e as any)}
            tabIndex={0}
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
