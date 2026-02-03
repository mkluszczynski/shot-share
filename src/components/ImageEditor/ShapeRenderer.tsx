import { Rect, Text, Arrow } from "react-konva";
import Konva from "konva";
import type { ShapeType, RectShape, TextShape, ArrowShape } from "../types/editor";

interface ShapeRendererProps {
    shapes: ShapeType[];
    currentRect: RectShape | null;
    currentArrow: ArrowShape | null;
    editingTextId: string | null;
    tool: string;
    onShapeClick: (id: string) => void;
    onTextDblClick: (shape: TextShape) => void;
    onDragEnd: (id: string, e: Konva.KonvaEventObject<DragEvent>) => void;
    onTransformEnd: (id: string, node: Konva.Node) => void;
}

export function ShapeRenderer({
    shapes,
    currentRect,
    currentArrow,
    editingTextId,
    tool,
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
                            draggable={tool === "select"}
                            onClick={() => onShapeClick(shape.id)}
                            onDblClick={() => onTextDblClick(shape)}
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
        </>
    );
}
