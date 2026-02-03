import { useRef, useEffect, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Rect, Text, Transformer } from "react-konva";
import { Button } from "./ui/button";
import Konva from "konva";
import { Square, Type, MousePointer2, Upload } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { toast } from "sonner";
import type { Settings } from "../types/settings";

type Tool = "select" | "rectangle" | "text";

interface Shape {
    id: string;
    type: "rect" | "text";
}

interface RectShape extends Shape {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
    stroke: string;
}

interface TextShape extends Shape {
    type: "text";
    x: number;
    y: number;
    text: string;
    fill: string;
    fontSize: number;
}

type ShapeType = RectShape | TextShape;

interface ImageEditorProps {
    imageDataUrl: string;
    onSave: (editedImageDataUrl: string) => void;
    onCancel: () => void;
}

export function ImageEditor({ imageDataUrl, onSave, onCancel }: ImageEditorProps) {
    const stageRef = useRef<Konva.Stage>(null);
    const layerRef = useRef<Konva.Layer>(null);
    const transformerRef = useRef<Konva.Transformer>(null);

    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [tool, setTool] = useState<Tool>("select");
    const [shapes, setShapes] = useState<ShapeType[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [color, setColor] = useState("#ef4444");
    const [uploading, setUploading] = useState(false);

    // Drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
    const [currentRect, setCurrentRect] = useState<RectShape | null>(null);

    // Text editing state
    const [editingText, setEditingText] = useState<{
        id: string;
        x: number;
        y: number;
        fontSize: number;
    } | null>(null);
    const [textValue, setTextValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Load image
    useEffect(() => {
        const img = new window.Image();
        img.onload = () => setImage(img);
        img.src = imageDataUrl;
    }, [imageDataUrl]);

    // Handle transformer
    useEffect(() => {
        if (!transformerRef.current || !layerRef.current) return;

        if (selectedId) {
            const node = layerRef.current.findOne(`#${selectedId}`);
            if (node) {
                transformerRef.current.nodes([node]);
            }
        } else {
            transformerRef.current.nodes([]);
        }
    }, [selectedId]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (editingText) return; // Don't handle shortcuts while editing text

            if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
                setShapes(prev => prev.filter(s => s.id !== selectedId));
                setSelectedId(null);
            }

            if (e.key === "Escape") {
                setTool("select");
                setSelectedId(null);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedId, editingText]);

    const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (editingText) return;

        const clickedOnEmpty = e.target === e.target.getStage();
        const clickedOnImage = e.target.getClassName() === 'Image';
        const stage = e.target.getStage();
        if (!stage) return;

        const pos = stage.getPointerPosition();
        if (!pos) return;

        if (tool === "select") {
            if (clickedOnEmpty || clickedOnImage) {
                setSelectedId(null);
            }
            return;
        }

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

        if (tool === "text") {
            const id = `text-${Date.now()}`;
            setEditingText({ id, x: pos.x, y: pos.y, fontSize: 24 });
            setTextValue("");
            setTimeout(() => textareaRef.current?.focus(), 10);
        }
    };

    const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!isDrawing || !drawStart || !currentRect) return;

        const stage = e.target.getStage();
        if (!stage) return;

        const pos = stage.getPointerPosition();
        if (!pos) return;

        setCurrentRect({
            ...currentRect,
            width: pos.x - drawStart.x,
            height: pos.y - drawStart.y,
        });
    };

    const handleStageMouseUp = () => {
        if (isDrawing && currentRect) {
            if (Math.abs(currentRect.width) > 5 && Math.abs(currentRect.height) > 5) {
                setShapes(prev => [...prev, currentRect]);
                setSelectedId(currentRect.id);
            }
            setIsDrawing(false);
            setDrawStart(null);
            setCurrentRect(null);
            setTool("select");
        }
    };

    const handleShapeClick = (id: string) => {
        if (tool === "select") {
            setSelectedId(id);
        }
    };

    const handleTextDblClick = (shape: TextShape) => {
        setEditingText({ id: shape.id, x: shape.x, y: shape.y, fontSize: shape.fontSize });
        setTextValue(shape.text);
        setSelectedId(null);
        setTimeout(() => {
            textareaRef.current?.focus();
            textareaRef.current?.select();
        }, 10);
    };

    const finishTextEditing = () => {
        if (!editingText) return;

        const trimmed = textValue.trim();
        if (trimmed) {
            setShapes(prev => {
                const existing = prev.find(s => s.id === editingText.id);
                if (existing && existing.type === "text") {
                    return prev.map(s =>
                        s.id === editingText.id
                            ? { ...s, text: trimmed }
                            : s
                    );
                } else {
                    return [...prev, {
                        id: editingText.id,
                        type: "text",
                        x: editingText.x,
                        y: editingText.y,
                        text: trimmed,
                        fill: color,
                        fontSize: editingText.fontSize,
                    } as TextShape];
                }
            });
        }

        setEditingText(null);
        setTextValue("");
        setTool("select");
    };

    const handleTextKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            setEditingText(null);
            setTextValue("");
            setTool("select");
        }
    };

    const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
        setShapes(prev => prev.map(shape =>
            shape.id === id
                ? { ...shape, x: e.target.x(), y: e.target.y() }
                : shape
        ));
    };

    const handleTransformEnd = (id: string, node: Konva.Node) => {
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);

        setShapes(prev => prev.map(shape => {
            if (shape.id !== id) return shape;

            if (shape.type === "rect") {
                return {
                    ...shape,
                    x: node.x(),
                    y: node.y(),
                    width: Math.max(5, shape.width * scaleX),
                    height: Math.max(5, shape.height * scaleY),
                };
            } else if (shape.type === "text") {
                return {
                    ...shape,
                    x: node.x(),
                    y: node.y(),
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
            toast.info("Preparing image...");

            // Get the edited image as data URL
            setSelectedId(null);
            await new Promise(resolve => setTimeout(resolve, 50));

            const dataUrl = stageRef.current.toDataURL();
            if (!dataUrl) {
                throw new Error("Failed to generate image");
            }

            toast.info("Loading settings...");
            const settings = await invoke<Settings>("get_settings");

            // Validate SFTP configuration (check for truly empty/whitespace-only values)
            if (!settings.sftp.host?.trim() || !settings.sftp.username?.trim()) {
                throw new Error("SFTP not configured. Please configure SFTP settings in Settings.");
            }

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const filename = `screenshot-${timestamp}.png`;

            // Save the image temporarily
            const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
            const tempPath = `${settings.save_directory}/${filename}`;

            toast.info("Saving image...");
            await invoke("save_base64_image", {
                base64Data,
                savePath: tempPath,
            });

            toast.info("Uploading to SFTP...");
            const remotePath = await invoke<string>("upload_to_sftp", {
                filePath: tempPath,
                filename,
                host: settings.sftp.host,
                port: settings.sftp.port,
                username: settings.sftp.username,
                password: settings.sftp.password,
                useSshKey: settings.sftp.use_ssh_key,
                remotePath: settings.sftp.remote_path,
            });

            // Construct the public URL
            const baseUrl = settings.sftp.base_url.replace(/\/$/, ""); // Remove trailing slash
            const publicUrl = `${baseUrl}/${filename}`;

            // Copy to clipboard if enabled
            if (settings.sftp.copy_to_clipboard) {
                try {
                    await writeText(publicUrl);
                    toast.success("Uploaded! Link copied to clipboard");
                } catch (clipboardError) {
                    console.error("Failed to copy to clipboard:", clipboardError);
                    toast.success(`Uploaded to ${remotePath}`, {
                        description: "Clipboard copy failed"
                    });
                }
            } else {
                toast.success(`Uploaded successfully to ${remotePath}`);
            }

            setTimeout(() => {
                onSave(dataUrl);
            }, 1500);
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Upload failed", {
                description: String(error)
            });
        } finally {
            setUploading(false);
        }
    };

    const handleSave = () => {
        if (!stageRef.current) return;

        setSelectedId(null);
        setTimeout(() => {
            const dataUrl = stageRef.current?.toDataURL();
            if (dataUrl) onSave(dataUrl);
        }, 50);
    };

    return (
        <div className="fixed inset-0 flex flex-col bg-gray-900">
            {/* Toolbar */}
            <div className="bg-gray-800 border-b border-gray-700">
                <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant={tool === "select" ? "default" : "outline"}
                            onClick={() => setTool("select")}
                            className="gap-2"
                        >
                            <MousePointer2 className="h-4 w-4" />
                            Select
                        </Button>
                        <Button
                            size="sm"
                            variant={tool === "rectangle" ? "default" : "outline"}
                            onClick={() => setTool("rectangle")}
                            className="gap-2"
                        >
                            <Square className="h-4 w-4" />
                            Rectangle
                        </Button>
                        <Button
                            size="sm"
                            variant={tool === "text" ? "default" : "outline"}
                            onClick={() => setTool("text")}
                            className="gap-2"
                        >
                            <Type className="h-4 w-4" />
                            Text
                        </Button>

                        <div className="ml-4 flex items-center gap-2">
                            <label className="text-sm text-gray-300">Color:</label>
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="h-8 w-16 cursor-pointer rounded border-0"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {selectedId && (
                            <span className="text-xs text-gray-400 mr-2">
                                Press Delete to remove
                            </span>
                        )}
                        <Button size="sm" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleUpload}
                            disabled={uploading}
                            className="gap-2"
                        >
                            <Upload className="h-4 w-4" />
                            {uploading ? "Uploading..." : "Upload"}
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                            Save
                        </Button>
                    </div>
                </div>
            </div>

            {/* Canvas */}
            <div
                className="flex-1 flex items-center justify-center overflow-auto p-4"
                onClick={(e) => {
                    // Deselect when clicking on the background (outside the canvas)
                    if (e.target === e.currentTarget) {
                        setSelectedId(null);
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
                            onMouseMove={handleStageMouseMove}
                            onMouseUp={handleStageMouseUp}
                            className="shadow-lg"
                        >
                            <Layer ref={layerRef}>
                                <KonvaImage image={image} />

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
                                                onClick={() => handleShapeClick(shape.id)}
                                                onDragEnd={(e) => handleDragEnd(shape.id, e)}
                                                onTransformEnd={(e) => handleTransformEnd(shape.id, e.target)}
                                            />
                                        );
                                    } else if (shape.type === "text") {
                                        // Don't render text that's currently being edited
                                        if (editingText && editingText.id === shape.id) {
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
                                                onClick={() => handleShapeClick(shape.id)}
                                                onDblClick={() => handleTextDblClick(shape)}
                                                onDragEnd={(e) => handleDragEnd(shape.id, e)}
                                                onTransformEnd={(e) => handleTransformEnd(shape.id, e.target)}
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

                                {tool === "select" && <Transformer ref={transformerRef} />}
                            </Layer>
                        </Stage>

                        {editingText && (
                            <div
                                className="absolute"
                                style={{
                                    left: editingText.x,
                                    top: editingText.y,
                                }}
                            >
                                <textarea
                                    ref={textareaRef}
                                    value={textValue}
                                    onChange={(e) => setTextValue(e.target.value)}
                                    onBlur={finishTextEditing}
                                    onKeyDown={handleTextKeyDown}
                                    placeholder="Type here..."
                                    className="outline-none resize-none block"
                                    style={{
                                        color: color,
                                        fontSize: `${editingText.fontSize}px`,
                                        fontFamily: "Arial",
                                        lineHeight: "1.2",
                                        padding: "0",
                                        margin: "0",
                                        border: "2px solid #3b82f6",
                                        background: "transparent",
                                        overflow: "hidden",
                                        minWidth: "2em",
                                        width: "fit-content",
                                        height: "auto",
                                        whiteSpace: "pre",
                                    }}
                                    rows={textValue.split('\n').length || 1}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
