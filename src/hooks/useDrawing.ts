import { useState } from "react";
import type { Tool, RectShape, ArrowShape, BlurShape } from "../types/editor";
import Konva from "konva";

interface UseDrawingProps {
    tool: Tool;
    color: string;
    onShapeComplete: (shape: RectShape | ArrowShape | BlurShape) => void;
    onToolChange: (tool: Tool) => void;
}

export function useDrawing({ tool, color, onShapeComplete, onToolChange }: UseDrawingProps) {
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
    const [currentRect, setCurrentRect] = useState<RectShape | null>(null);
    const [currentArrow, setCurrentArrow] = useState<ArrowShape | null>(null);
    const [currentBlur, setCurrentBlur] = useState<BlurShape | null>(null);

    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        if (!stage) return;

        const pos = stage.getPointerPosition();
        if (!pos) return;

        if (tool === "rectangle") {
            setIsDrawing(true);
            setDrawStart(pos);
            setCurrentRect({
                id: `rect-${Date.now()}`,
                type: "rect",
                x: pos.x,
                y: pos.y,
                width: 0,
                height: 0,
                stroke: color,
            });
        }

        if (tool === "arrow") {
            setIsDrawing(true);
            setDrawStart(pos);
            setCurrentArrow({
                id: `arrow-${Date.now()}`,
                type: "arrow",
                points: [pos.x, pos.y, pos.x, pos.y],
                stroke: color,
                pointerLength: 10,
                pointerWidth: 10,
            });
        }

        if (tool === "blur") {
            setIsDrawing(true);
            setDrawStart(pos);
            setCurrentBlur({
                id: `blur-${Date.now()}`,
                type: "blur",
                x: pos.x,
                y: pos.y,
                width: 0,
                height: 0,
            });
        }
    };

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!isDrawing || !drawStart) return;

        const stage = e.target.getStage();
        if (!stage) return;

        const pos = stage.getPointerPosition();
        if (!pos) return;

        if (currentRect) {
            setCurrentRect({
                ...currentRect,
                width: pos.x - drawStart.x,
                height: pos.y - drawStart.y,
            });
        }

        if (currentArrow) {
            setCurrentArrow({
                ...currentArrow,
                points: [drawStart.x, drawStart.y, pos.x, pos.y],
            });
        }

        if (currentBlur) {
            setCurrentBlur({
                ...currentBlur,
                width: pos.x - drawStart.x,
                height: pos.y - drawStart.y,
            });
        }
    };

    const handleMouseUp = () => {
        if (isDrawing && currentRect) {
            if (Math.abs(currentRect.width) > 5 && Math.abs(currentRect.height) > 5) {
                onShapeComplete(currentRect);
            }
            setIsDrawing(false);
            setDrawStart(null);
            setCurrentRect(null);
            onToolChange("select");
        }

        if (isDrawing && currentArrow) {
            const [x1, y1, x2, y2] = currentArrow.points;
            const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            if (distance > 10) {
                onShapeComplete(currentArrow);
            }
            setIsDrawing(false);
            setDrawStart(null);
            setCurrentArrow(null);
            onToolChange("select");
        }

        if (isDrawing && currentBlur) {
            if (Math.abs(currentBlur.width) > 5 && Math.abs(currentBlur.height) > 5) {
                onShapeComplete(currentBlur);
            }
            setIsDrawing(false);
            setDrawStart(null);
            setCurrentBlur(null);
            onToolChange("select");
        }
    };

    return {
        isDrawing,
        currentRect,
        currentArrow,
        currentBlur,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
    };
}
