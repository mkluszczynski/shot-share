import { useRef, useEffect, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";
import Konva from "konva";
import type { Tool, ShapeType } from "../../types/editor";
import { useDrawing } from "../../hooks/useDrawing";
import { useTextEditing } from "../../hooks/useTextEditing";
import { useShapeSelection } from "../../hooks/useShapeSelection";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { uploadImageToSftp } from "../../services/uploadService";
import { EditorToolbar } from "./EditorToolbar";
import { ShapeRenderer } from "./ShapeRenderer";
import { TextEditorOverlay } from "./TextEditorOverlay";

interface ImageEditorProps {
    imageDataUrl: string;
    onSave: (editedImageDataUrl: string) => void;
    onCancel: () => void;
}

export function ImageEditor({ imageDataUrl, onSave, onCancel }: ImageEditorProps) {
    const stageRef = useRef<Konva.Stage>(null);
    const layerRef = useRef<Konva.Layer>(null);

    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [tool, setTool] = useState<Tool>("select");
    const [shapes, setShapes] = useState<ShapeType[]>([]);
    const [color, setColor] = useState("#ef4444");
    const [uploading, setUploading] = useState(false);

    // Load image
    useEffect(() => {
        const img = new window.Image();
        img.onload = () => setImage(img);
        img.src = imageDataUrl;
    }, [imageDataUrl]);

    // Shape management
    const addShape = (shape: ShapeType) => {
        setShapes(prev => [...prev, shape]);
    };

    const updateShape = (id: string, updates: Partial<ShapeType>) => {
        setShapes(prev => prev.map(s => s.id === id ? { ...s, ...updates } as ShapeType : s));
    };

    const deleteShape = (id: string) => {
        setShapes(prev => prev.filter(s => s.id !== id));
    };

    // Custom hooks
    const { selectedId, transformerRef, setSelectedId, handleShapeClick, clearSelection } =
        useShapeSelection({ tool, layerRef });

    const drawing = useDrawing({
        tool,
        color,
        onShapeComplete: (shape) => {
            addShape(shape);
            setSelectedId(shape.id);
        },
        onToolChange: setTool,
    });

    const textEditing = useTextEditing({
        tool,
        color,
        shapes,
        onShapeAdd: addShape,
        onShapeUpdate: updateShape,
        onToolChange: setTool,
        clearSelection,
    });

    useKeyboardShortcuts({
        selectedId,
        editingText: !!textEditing.editingText,
        onDelete: () => {
            if (selectedId) {
                deleteShape(selectedId);
                clearSelection();
            }
        },
        onEscape: () => {
            setTool("select");
            clearSelection();
        },
    });

    const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (textEditing.editingText) return;

        const clickedOnEmpty = e.target === e.target.getStage();
        const clickedOnImage = e.target.getClassName() === 'Image';
        const stage = e.target.getStage();
        if (!stage) return;

        const pos = stage.getPointerPosition();
        if (!pos) return;

        if (tool === "select") {
            if (clickedOnEmpty || clickedOnImage) {
                clearSelection();
            }
            return;
        }

        if (tool === "text") {
            textEditing.startTextEditing(pos.x, pos.y);
            return;
        }

        if (tool === "stepper") {
            // Find the lowest available number
            const existingNumbers = shapes
                .filter(s => s.type === "stepper")
                .map(s => (s as any).number)
                .sort((a, b) => a - b);

            let nextNumber = 1;
            for (const num of existingNumbers) {
                if (num === nextNumber) {
                    nextNumber++;
                } else {
                    break;
                }
            }

            const stepperShape: ShapeType = {
                id: `stepper-${Date.now()}`,
                type: "stepper",
                x: pos.x,
                y: pos.y,
                number: nextNumber,
                fill: color,
                fontSize: 16,
            };
            addShape(stepperShape);
            return;
        }

        drawing.handleMouseDown(e);
    };

    const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
        const node = e.target;
        const deltaX = node.x();
        const deltaY = node.y();

        setShapes(prev => prev.map(shape => {
            if (shape.id !== id) return shape;

            if (shape.type === "arrow") {
                const [x1, y1, x2, y2] = shape.points;
                return {
                    ...shape,
                    points: [x1 + deltaX, y1 + deltaY, x2 + deltaX, y2 + deltaY],
                };
            } else if (shape.type === "blur") {
                return { ...shape, x: shape.x + deltaX, y: shape.y + deltaY };
            } else {
                return { ...shape, x: deltaX, y: deltaY };
            }
        }));

        node.position({ x: 0, y: 0 });
    };

    const handleTransformEnd = (id: string, node: Konva.Node) => {
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        const x = node.x();
        const y = node.y();

        node.scaleX(1);
        node.scaleY(1);
        node.position({ x: 0, y: 0 });

        setShapes(prev => prev.map(shape => {
            if (shape.id !== id) return shape;

            if (shape.type === "rect") {
                return {
                    ...shape,
                    x: x,
                    y: y,
                    width: Math.max(5, shape.width * scaleX),
                    height: Math.max(5, shape.height * scaleY),
                };
            } else if (shape.type === "blur") {
                return {
                    ...shape,
                    x: x,
                    y: y,
                    width: Math.max(5, shape.width * scaleX),
                    height: Math.max(5, shape.height * scaleY),
                };
            } else if (shape.type === "text") {
                return {
                    ...shape,
                    x: x,
                    y: y,
                    fontSize: Math.max(12, shape.fontSize * scaleY),
                };
            } else if (shape.type === "stepper") {
                return {
                    ...shape,
                    x: x,
                    y: y,
                    fontSize: Math.max(12, shape.fontSize * scaleY),
                };
            }
            return shape;
        }));
    };

    const handleUpload = async () => {
        if (!stageRef.current) return;

        try {
            setUploading(true);
            clearSelection();
            await new Promise(resolve => setTimeout(resolve, 50));

            const dataUrl = stageRef.current.toDataURL();
            if (!dataUrl) {
                throw new Error("Failed to generate image");
            }

            await uploadImageToSftp(dataUrl, () => onSave(dataUrl));
        } catch (error) {
            // Error handling is done in the service
        } finally {
            setUploading(false);
        }
    };

    const handleSave = () => {
        if (!stageRef.current) return;

        clearSelection();
        setTimeout(() => {
            const dataUrl = stageRef.current?.toDataURL();
            if (dataUrl) onSave(dataUrl);
        }, 50);
    };

    return (
        <div className="fixed inset-0 flex flex-col bg-gray-900">
            <EditorToolbar
                tool={tool}
                color={color}
                selectedId={selectedId}
                uploading={uploading}
                onToolChange={setTool}
                onColorChange={setColor}
                onUpload={handleUpload}
                onSave={handleSave}
                onCancel={onCancel}
            />

            <div
                className="flex-1 flex items-center justify-center overflow-auto p-4"
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        clearSelection();
                    }
                }}
            >
                {image && (
                    <div className="relative">
                        <Stage
                            ref={stageRef}
                            width={image.width}
                            height={image.height}
                            onMouseDown={handleStageMouseDown}
                            onMouseMove={drawing.handleMouseMove}
                            onMouseUp={drawing.handleMouseUp}
                            className="shadow-lg"
                        >
                            <Layer ref={layerRef}>
                                <KonvaImage image={image} />

                                <ShapeRenderer
                                    shapes={shapes}
                                    currentRect={drawing.currentRect}
                                    currentArrow={drawing.currentArrow}
                                    currentBlur={drawing.currentBlur}
                                    editingTextId={textEditing.editingText?.id ?? null}
                                    tool={tool}
                                    selectedId={selectedId}
                                    stageRef={stageRef}
                                    onShapeClick={handleShapeClick}
                                    onTextDblClick={textEditing.handleTextDblClick}
                                    onDragEnd={handleDragEnd}
                                    onTransformEnd={handleTransformEnd}
                                />

                                {tool === "select" && !textEditing.editingText && <Transformer ref={transformerRef} />}
                            </Layer>
                        </Stage>

                        {textEditing.editingText && (
                            <TextEditorOverlay
                                editingText={textEditing.editingText}
                                textValue={textEditing.textValue}
                                color={color}
                                textareaRef={textEditing.textareaRef}
                                onTextChange={textEditing.setTextValue}
                                onBlur={textEditing.finishTextEditing}
                                onKeyDown={textEditing.handleTextKeyDown}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
