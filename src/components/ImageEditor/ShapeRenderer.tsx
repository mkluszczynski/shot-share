import { Rect, Text, Arrow, Circle, Group, Image as KonvaImage } from "react-konva";
import Konva from "konva";
import React, { useEffect, useRef } from "react";
import type { ShapeType, RectShape, TextShape, ArrowShape, BlurShape } from "../../types/editor";

interface ShapeRendererProps {
    shapes: ShapeType[];
    currentRect: RectShape | null;
    currentArrow: ArrowShape | null;
    currentBlur: BlurShape | null;
    editingTextId: string | null;
    tool: string;
    selectedId: string | null;
    stageRef: React.RefObject<Konva.Stage>;
    onShapeClick: (id: string) => void;
    onTextDblClick: (shape: TextShape) => void;
    onDragEnd: (id: string, e: Konva.KonvaEventObject<DragEvent>) => void;
    onTransformEnd: (id: string, node: Konva.Node) => void;
}

// Component to render a single blur shape with pixelation effect
function BlurRect({ shape, draggable, stageRef, isSelected, onClick, onDragEnd, onTransformEnd }: {
    shape: BlurShape;
    draggable: boolean;
    stageRef: React.RefObject<Konva.Stage>;
    isSelected: boolean;
    onClick: () => void;
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
    onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
}) {
    const imageRef = useRef<Konva.Image>(null);
    const groupRef = useRef<Konva.Group>(null);
    const [blurredImage, setBlurredImage] = React.useState<HTMLImageElement | null>(null);

    useEffect(() => {
        if (!stageRef.current) return;

        const stage = stageRef.current;

        // Get the absolute position and dimensions
        const x = Math.min(shape.x, shape.x + shape.width);
        const y = Math.min(shape.y, shape.y + shape.height);
        const width = Math.abs(shape.width);
        const height = Math.abs(shape.height);

        if (width === 0 || height === 0) return;

        // Create a temporary canvas to capture and pixelate the region
        const canvas = document.createElement('canvas');
        const pixelSize = 10; // Size of pixelation blocks
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        // Convert the stage to a data URL and load it
        const dataURL = stage.toDataURL({ x, y, width, height, pixelRatio: 1 });
        const stageImage = new window.Image();

        stageImage.onload = () => {
            // Draw the captured region
            ctx.drawImage(stageImage, 0, 0, width, height);

            // Apply pixelation effect
            const imageData = ctx.getImageData(0, 0, width, height);
            const pixelatedData = ctx.createImageData(width, height);

            for (let py = 0; py < height; py += pixelSize) {
                for (let px = 0; px < width; px += pixelSize) {
                    // Get average color of the block
                    let r = 0, g = 0, b = 0, count = 0;
                    for (let dy = 0; dy < pixelSize && py + dy < height; dy++) {
                        for (let dx = 0; dx < pixelSize && px + dx < width; dx++) {
                            const idx = ((py + dy) * width + (px + dx)) * 4;
                            r += imageData.data[idx];
                            g += imageData.data[idx + 1];
                            b += imageData.data[idx + 2];
                            count++;
                        }
                    }
                    r = Math.floor(r / count);
                    g = Math.floor(g / count);
                    b = Math.floor(b / count);

                    // Fill the block with average color
                    for (let dy = 0; dy < pixelSize && py + dy < height; dy++) {
                        for (let dx = 0; dx < pixelSize && px + dx < width; dx++) {
                            const idx = ((py + dy) * width + (px + dx)) * 4;
                            pixelatedData.data[idx] = r;
                            pixelatedData.data[idx + 1] = g;
                            pixelatedData.data[idx + 2] = b;
                            pixelatedData.data[idx + 3] = 255;
                        }
                    }
                }
            }

            ctx.putImageData(pixelatedData, 0, 0);

            // Create image from canvas and set it
            const pixelatedImage = new window.Image();
            pixelatedImage.onload = () => {
                setBlurredImage(pixelatedImage);
            };
            pixelatedImage.src = canvas.toDataURL();
        };

        stageImage.src = dataURL;
    }, [shape, stageRef]);

    if (!blurredImage) {
        return null;
    }

    return (
        <Group
            ref={groupRef}
            id={shape.id}
            draggable={draggable}
            onClick={onClick}
            onDragEnd={onDragEnd}
            onTransformEnd={onTransformEnd}
        >
            <KonvaImage
                ref={imageRef}
                image={blurredImage}
                x={Math.min(shape.x, shape.x + shape.width)}
                y={Math.min(shape.y, shape.y + shape.height)}
                width={Math.abs(shape.width)}
                height={Math.abs(shape.height)}
            />
            {isSelected && (
                <Rect
                    x={Math.min(shape.x, shape.x + shape.width)}
                    y={Math.min(shape.y, shape.y + shape.height)}
                    width={Math.abs(shape.width)}
                    height={Math.abs(shape.height)}
                    stroke="#00aaff"
                    strokeWidth={2}
                    listening={false}
                />
            )}
        </Group>
    );
}

export function ShapeRenderer({
    shapes,
    currentRect,
    currentArrow,
    currentBlur,
    editingTextId,
    tool,
    selectedId,
    stageRef,
    onShapeClick,
    onTextDblClick,
    onDragEnd,
    onTransformEnd,
}: ShapeRendererProps) {
    return (
        <>
            {shapes.map(shape => {
                if (shape.type === "rect") {
                    return (
                        <Rect
                            key={shape.id}
                            id={shape.id}
                            x={shape.x}
                            y={shape.y}
                            width={shape.width}
                            height={shape.height}
                            stroke={shape.stroke}
                            strokeWidth={3}
                            draggable={tool === "select"}
                            onClick={() => onShapeClick(shape.id)}
                            onDragEnd={(e) => onDragEnd(shape.id, e)}
                            onTransformEnd={(e) => onTransformEnd(shape.id, e.target)}
                        />
                    );
                } else if (shape.type === "arrow") {
                    return (
                        <Arrow
                            key={shape.id}
                            id={shape.id}
                            points={shape.points}
                            stroke={shape.stroke}
                            strokeWidth={3}
                            fill={shape.stroke}
                            pointerLength={shape.pointerLength}
                            pointerWidth={shape.pointerWidth}
                            draggable={tool === "select"}
                            onClick={() => onShapeClick(shape.id)}
                            onDragEnd={(e) => onDragEnd(shape.id, e)}
                        />
                    );
                } else if (shape.type === "text") {
                    // Don't render text that's currently being edited
                    if (editingTextId && editingTextId === shape.id) {
                        return null;
                    }
                    const isEditingThisText = editingTextId && editingTextId === shape.id;
                    const canInteract = tool === "select" && !isEditingThisText;
                    return (
                        <Text
                            key={shape.id}
                            id={shape.id}
                            x={shape.x}
                            y={shape.y}
                            text={shape.text}
                            fontSize={shape.fontSize}
                            fill={shape.fill}
                            fontFamily="Arial"
                            lineHeight={1.2}
                            draggable={canInteract}
                            listening={canInteract}
                            onClick={() => canInteract && onShapeClick(shape.id)}
                            onDblClick={() => canInteract && onTextDblClick(shape)}
                            onDragEnd={(e) => onDragEnd(shape.id, e)}
                            onTransformEnd={(e) => onTransformEnd(shape.id, e.target)}
                        />
                    );
                } else if (shape.type === "stepper") {
                    const radius = shape.fontSize;
                    return (
                        <Group
                            key={shape.id}
                            id={shape.id}
                            x={shape.x}
                            y={shape.y}
                            draggable={tool === "select"}
                            onClick={() => onShapeClick(shape.id)}
                            onDragEnd={(e) => onDragEnd(shape.id, e)}
                            onTransformEnd={(e) => onTransformEnd(shape.id, e.target)}
                        >
                            <Circle
                                radius={radius}
                                fill={shape.fill}
                            />
                            <Text
                                x={-radius}
                                y={-shape.fontSize / 2}
                                width={radius * 2}
                                text={shape.number.toString()}
                                fontSize={shape.fontSize}
                                fill="#ffffff"
                                fontFamily="Arial"
                                fontStyle="bold"
                                align="center"
                                verticalAlign="middle"
                            />
                        </Group>
                    );
                } else if (shape.type === "blur") {
                    return (
                        <BlurRect
                            key={shape.id}
                            shape={shape}
                            draggable={false}
                            stageRef={stageRef}
                            isSelected={selectedId === shape.id}
                            onClick={() => onShapeClick(shape.id)}
                            onDragEnd={(e) => onDragEnd(shape.id, e)}
                            onTransformEnd={(e) => onTransformEnd(shape.id, e.target)}
                        />
                    );
                }
                return null;
            })}

            {currentRect && (
                <Rect
                    x={currentRect.x}
                    y={currentRect.y}
                    width={currentRect.width}
                    height={currentRect.height}
                    stroke={currentRect.stroke}
                    strokeWidth={3}
                />
            )}

            {currentArrow && (
                <Arrow
                    points={currentArrow.points}
                    stroke={currentArrow.stroke}
                    strokeWidth={3}
                    fill={currentArrow.stroke}
                    pointerLength={currentArrow.pointerLength}
                    pointerWidth={currentArrow.pointerWidth}
                />
            )}

            {currentBlur && (
                <Rect
                    x={currentBlur.x}
                    y={currentBlur.y}
                    width={currentBlur.width}
                    height={currentBlur.height}
                    stroke="#00aaff"
                    strokeWidth={2}
                    dash={[5, 5]}
                />
            )}
        </>
    );
}
