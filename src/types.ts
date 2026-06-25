import type { Edge, Node } from "@xyflow/react";

/** Mermaid flowchart orientation. */
export type Direction = "TB" | "BT" | "LR" | "RL";

/** Visual shape rendered on the canvas and mapped to a Mermaid node shape. */
export type ShapeKind =
  | "rectangle"
  | "rounded"
  | "stadium"
  | "subroutine"
  | "cylinder"
  | "circle"
  | "rhombus"
  | "hexagon"
  | "parallelogram"
  | "trapezoid"
  | "doublecircle";

export interface ShapeNodeData extends Record<string, unknown> {
  label: string;
  shape: ShapeKind;
  /** Accent color (hex) used for the node border/background tint. */
  color?: string;
  /** Optional icon key from the OpenShift / cloud catalog. */
  icon?: string;
  /** Optional category label shown as a small chip (e.g. "Pod", "Route"). */
  kind?: string;
  /** Free-form subtitle/metadata line. */
  subtitle?: string;
}

export type FlowNode = Node<ShapeNodeData, "shape">;
export type FlowEdge = Edge<{
  label?: string;
  style?: EdgeLineStyle;
}>;

export type EdgeLineStyle = "solid" | "dotted" | "thick";

export interface DiagramSnapshot {
  direction: Direction;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

/** Edge arrow/line variants supported by the Mermaid generator. */
export interface EdgeMeta {
  label?: string;
  style?: EdgeLineStyle;
}
