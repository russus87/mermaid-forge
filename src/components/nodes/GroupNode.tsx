import { memo, useEffect, useRef, useState } from "react";
import { Handle, NodeResizer, Position, type NodeProps } from "@xyflow/react";
import * as Icons from "lucide-react";

import type { FlowNode } from "../../types";
import { useStore } from "../../store/useStore";

function LucideIcon({ name, color }: { name?: string; color?: string }) {
  if (!name) return null;
  const Comp = (Icons as unknown as Record<string, Icons.LucideIcon>)[name];
  return Comp ? <Comp size={15} color={color} strokeWidth={2.2} /> : null;
}

function GroupNodeImpl({ data, selected, id }: NodeProps<FlowNode>) {
  const accent = data.color ?? "#cc0000";
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

  return (
    <div className={`mf-group ${selected ? "is-selected" : ""}`} style={{ "--accent": accent } as React.CSSProperties}>
      <NodeResizer
        isVisible={selected}
        minWidth={160}
        minHeight={120}
        lineClassName="mf-resize-line"
        handleClassName="mf-resize-handle"
      />
      {[Position.Top, Position.Right, Position.Bottom, Position.Left].map((p) => (
        <Handle key={p} id={p} type="source" position={p} className="mf-handle" />
      ))}
      <div
        className="mf-group-header"
        style={{ color: accent }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
      >
        <span className="mf-group-icon" style={{ background: `${accent}22` }}>
          <LucideIcon name="FolderTree" color={accent} />
        </span>
        {data.kind && <span className="mf-group-kind">{data.kind}</span>}
        {editing ? (
          <input
            ref={inputRef}
            className="mf-group-edit nodrag nopan"
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
          <span className="mf-group-label">{data.label}</span>
        )}
      </div>
    </div>
  );
}

export const GroupNode = memo(GroupNodeImpl);
