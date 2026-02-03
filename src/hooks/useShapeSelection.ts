import { useState, useEffect, useRef } from "react";
import Konva from "konva";

interface UseShapeSelectionProps {
    tool: string;
    layerRef: React.RefObject<Konva.Layer>;
}

export function useShapeSelection({ tool, layerRef }: UseShapeSelectionProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const transformerRef = useRef<Konva.Transformer>(null);

    // Update transformer when selection changes
    useEffect(() => {
        if (!transformerRef.current || !layerRef.current) return;

        if (selectedId) {
            const node = layerRef.current.findOne(`#${selectedId}`);
            if (node) {
                // Don't attach transformer to blur shapes (they shouldn't be resizable)
                const isBlurShape = selectedId.startsWith('blur-');
                if (isBlurShape) {
                    transformerRef.current.nodes([]);
                } else {
                    transformerRef.current.nodes([node]);
                }
            }
        } else {
            transformerRef.current.nodes([]);
        }
    }, [selectedId, layerRef]);

    const handleShapeClick = (id: string) => {
        if (tool === "select") {
            setSelectedId(id);
        }
    };

    const clearSelection = () => {
        setSelectedId(null);
    };

    return {
        selectedId,
        transformerRef,
        setSelectedId,
        handleShapeClick,
        clearSelection,
    };
}
