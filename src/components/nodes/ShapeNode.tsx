import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Handle, NodeResizer, Position, type NodeProps } from "@xyflow/react";
import * as Icons from "lucide-react";

import type { FlowNode, ShapeKind } from "../../types";
import { useStore } from "../../store/useStore";

/** CSS clip-paths giving each Mermaid shape a recognizable silhouette. */
const CLIP: Partial<Record<ShapeKind, string>> = {
  rhombus: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
  hexagon: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
  parallelogram: "polygon(18% 0%, 100% 0%, 82% 100%, 0% 100%)",
  trapezoid: "polygon(18% 0%, 82% 0%, 100% 100%, 0% 100%)",
};

function radiusFor(shape: ShapeKind): string {
  switch (shape) {
    case "rounded":
      return "14px";
    case "stadium":
      return "999px";
    case "circle":
    case "doublecircle":
      return "50%";
    case "rectangle":
    case "subroutine":
    case "cylinder":
      return "6px";
    default:
      return "8px";
  }
}

function LucideIcon({ name, size = 16, color }: { name?: string; size?: number; color?: string }) {
  if (!name) return null;
  const Comp = (Icons as unknown as Record<string, Icons.LucideIcon>)[name];
  if (!Comp) return null;
  return <Comp size={size} color={color} strokeWidth={2.2} />;
}

const HANDLE_POSITIONS: { id: string; position: Position }[] = [
  { id: "t", position: Position.Top },
  { id: "r", position: Position.Right },
  { id: "b", position: Position.Bottom },
  { id: "l", position: Position.Left },
];

function ShapeNodeImpl({ data, selected, id }: NodeProps<FlowNode>) {
  const accent = data.color ?? "#6366f1";
  const clip = CLIP[data.shape];
  const isCircle = data.shape === "circle" || data.shape === "doublecircle";
  const updateNodeData = useStore((s) => s.updateNodeData);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(data.label);
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [editing, data.label]);

  function commit() {
    setEditing(false);
    if (draft !== data.label) updateNodeData(id, { label: draft });
  }

  const style = useMemo<React.CSSProperties>(
    () => ({
      "--accent": accent,
      borderRadius: radiusFor(data.shape),
      clipPath: clip,
      aspectRatio: isCircle ? "1 / 1" : undefined,
      boxShadow: data.shape === "subroutine" ? `inset 0 0 0 3px ${accent}33` : undefined,
    } as React.CSSProperties),
    [accent, clip, data.shape, isCircle],
  );

  return (
    <div
      className={`mf-node ${selected ? "is-selected" : ""}`}
      style={style}
      data-shape={data.shape}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={120}
        minHeight={56}
        lineClassName="mf-resize-line"
        handleClassName="mf-resize-handle"
      />
      {HANDLE_POSITIONS.map((h) => (
        <Handle key={`s-${h.id}`} id={h.id} type="source" position={h.position} className="mf-handle" />
      ))}
      {HANDLE_POSITIONS.map((h) => (
        <Handle key={`tg-${h.id}`} id={`${h.id}-t`} type="target" position={h.position} className="mf-handle mf-handle-target" />
      ))}

      <div className="mf-node-body">
        {data.icon && (
          <div className="mf-node-icon" style={{ background: `${accent}1f`, color: accent }}>
            <LucideIcon name={data.icon} size={18} color={accent} />
          </div>
        )}
        <div className="mf-node-text">
          {data.kind && <span className="mf-node-kind" style={{ color: accent }}>{data.kind}</span>}
          {editing ? (
            <input
              ref={inputRef}
              className="mf-node-edit nodrag nopan"
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") setEditing(false);
                e.stopPropagation();
              }}
            />
          ) : (
            <span className="mf-node-label">{data.label || "Untitled"}</span>
          )}
          {data.subtitle && !editing && <span className="mf-node-sub">{data.subtitle}</span>}
        </div>
      </div>
      <span className="mf-node-rail" style={{ background: accent }} aria-hidden />
    </div>
  );
}

export const ShapeNode = memo(ShapeNodeImpl);
