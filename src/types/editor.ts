export type Tool = "select" | "rectangle" | "text" | "arrow";

export interface Shape {
    id: string;
    type: "rect" | "text" | "arrow";
}

export interface RectShape extends Shape {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
    stroke: string;
}

export interface TextShape extends Shape {
    type: "text";
    x: number;
    y: number;
    text: string;
    fill: string;
    fontSize: number;
}

export interface ArrowShape extends Shape {
    type: "arrow";
    points: number[];
    stroke: string;
    pointerLength: number;
    pointerWidth: number;
}

export type ShapeType = RectShape | TextShape | ArrowShape;

export interface TextEditingState {
    id: string;
    x: number;
    y: number;
    fontSize: number;
}
