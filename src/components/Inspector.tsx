import * as Icons from "lucide-react";

import { useStore } from "../store/useStore";
import type { ShapeKind } from "../types";

const SHAPES: { value: ShapeKind; label: string }[] = [
  { value: "rectangle", label: "Rectangle" },
  { value: "rounded", label: "Rounded" },
  { value: "stadium", label: "Stadium" },
  { value: "subroutine", label: "Subroutine" },
  { value: "cylinder", label: "Cylinder" },
  { value: "circle", label: "Circle" },
  { value: "rhombus", label: "Decision" },
  { value: "hexagon", label: "Hexagon" },
  { value: "parallelogram", label: "Parallelogram" },
  { value: "trapezoid", label: "Trapezoid" },
];

const SWATCHES = [
  "#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444",
  "#ec4899", "#8b5cf6", "#14b8a6", "#326ce5", "#ee0000",
  "#475569", "#db2777",
];

export function Inspector() {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const selectedEdgeId = useStore((s) => s.selectedEdgeId);
  const updateNodeData = useStore((s) => s.updateNodeData);
  const setEdgeLabel = useStore((s) => s.setEdgeLabel);
  const setEdgeStyle = useStore((s) => s.setEdgeStyle);
  const deleteSelected = useStore((s) => s.deleteSelected);

  const node = nodes.find((n) => n.id === selectedNodeId);
  const edge = edges.find((e) => e.id === selectedEdgeId);

  if (!node && !edge) {
    return (
      <div className="mf-inspector mf-inspector-empty">
        <Icons.MousePointerClick size={26} />
        <p>Select a node or connection to edit its properties.</p>
        <p className="mf-hint">Tip: right-click the canvas to drop a blank node.</p>
      </div>
    );
  }

  if (edge) {
    return (
      <div className="mf-inspector">
        <header className="mf-inspector-head">
          <Icons.Spline size={16} />
          <span>Connection</span>
        </header>

        <label className="mf-field">
          <span>Label</span>
          <input
            value={edge.data?.label ?? ""}
            placeholder="e.g. routes to"
            onChange={(e) => setEdgeLabel(edge.id, e.target.value)}
          />
        </label>

        <div className="mf-field">
          <span>Line style</span>
          <div className="mf-segmented">
            {(["solid", "dotted", "thick"] as const).map((s) => (
              <button
                key={s}
                className={edge.data?.style === s || (!edge.data?.style && s === "solid") ? "active" : ""}
                onClick={() => setEdgeStyle(edge.id, s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button className="mf-danger" onClick={deleteSelected}>
          <Icons.Trash2 size={15} /> Delete connection
        </button>
      </div>
    );
  }

  if (!node) return null;

  return (
    <div className="mf-inspector">
      <header className="mf-inspector-head">
        <Icons.Box size={16} />
        <span>Node</span>
      </header>

      <label className="mf-field">
        <span>Label</span>
        <input
          value={node.data.label}
          onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
        />
      </label>

      <label className="mf-field">
        <span>Category chip</span>
        <input
          value={node.data.kind ?? ""}
          placeholder="e.g. Pod, Service…"
          onChange={(e) => updateNodeData(node.id, { kind: e.target.value || undefined })}
        />
      </label>

      <label className="mf-field">
        <span>Shape</span>
        <select
          value={node.data.shape}
          onChange={(e) => updateNodeData(node.id, { shape: e.target.value as ShapeKind })}
        >
          {SHAPES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </label>

      <div className="mf-field">
        <span>Accent color</span>
        <div className="mf-swatches">
          {SWATCHES.map((c) => (
            <button
              key={c}
              className={`mf-swatch ${node.data.color === c ? "active" : ""}`}
              style={{ background: c }}
              onClick={() => updateNodeData(node.id, { color: c })}
              aria-label={c}
            />
          ))}
          <label className="mf-swatch mf-swatch-custom" title="Custom color">
            <Icons.Pipette size={13} />
            <input
              type="color"
              value={node.data.color ?? "#6366f1"}
              onChange={(e) => updateNodeData(node.id, { color: e.target.value })}
            />
          </label>
        </div>
      </div>

      <button className="mf-danger" onClick={deleteSelected}>
        <Icons.Trash2 size={15} /> Delete node
      </button>
    </div>
  );
}
