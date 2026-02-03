import type { TextEditingState } from "../types/editor";

interface TextEditorOverlayProps {
    editingText: TextEditingState;
    textValue: string;
    color: string;
    textareaRef: React.RefObject<HTMLTextAreaElement>;
    onTextChange: (value: string) => void;
    onBlur: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
}

export function TextEditorOverlay({
    editingText,
    textValue,
    color,
    textareaRef,
    onTextChange,
    onBlur,
    onKeyDown,
}: TextEditorOverlayProps) {
    return (
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
                onChange={(e) => onTextChange(e.target.value)}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
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
    );
}
