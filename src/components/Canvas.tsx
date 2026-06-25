import { useCallback, useRef } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { ShapeNode } from "./nodes/ShapeNode";
import { useStore } from "../store/useStore";
import type { FlowEdge } from "../types";

const nodeTypes: NodeTypes = { shape: ShapeNode };
const edgeTypes: EdgeTypes = {};

function styleForEdge(e: FlowEdge): Edge {
  const variant = e.data?.style ?? "solid";
  const stroke = "var(--edge-color)";
  return {
    ...e,
    label: e.data?.label,
    type: "smoothstep",
    animated: variant === "dotted",
    markerEnd: { type: "arrowclosed" as never, color: "#8b93a7", width: 18, height: 18 },
    style: {
      stroke,
      strokeWidth: variant === "thick" ? 3.5 : 2,
      strokeDasharray: variant === "dotted" ? "6 5" : undefined,
    },
    labelStyle: { fill: "var(--text)", fontWeight: 600, fontSize: 12 },
    labelBgStyle: { fill: "var(--panel)", fillOpacity: 0.9 },
    labelBgPadding: [6, 3] as [number, number],
    labelBgBorderRadius: 6,
  };
}

function InnerCanvas() {
  const wrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const onNodesChange = useStore((s) => s.onNodesChange);
  const onEdgesChange = useStore((s) => s.onEdgesChange);
  const onConnect = useStore((s) => s.onConnect);
  const addNodeFromPalette = useStore((s) => s.addNodeFromPalette);
  const addBlankNode = useStore((s) => s.addBlankNode);
  const select = useStore((s) => s.select);
  const commit = useStore((s) => s.commit);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const itemId = event.dataTransfer.getData("application/mermaid-forge");
      if (!itemId) return;
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addNodeFromPalette(itemId, position);
    },
    [screenToFlowPosition, addNodeFromPalette],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const styledEdges = edges.map(styleForEdge);

  return (
    <div className="mf-canvas" ref={wrapper}>
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={() => commit()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={(_, n) => select(n.id, null)}
        onEdgeClick={(_, e) => select(null, e.id)}
        onPaneClick={() => select(null, null)}
        onPaneContextMenu={(e) => {
          e.preventDefault();
          const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
          addBlankNode(position);
        }}
        connectionRadius={32}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: "smoothstep" }}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1.1 }}
        minZoom={0.15}
        maxZoom={2.5}
        snapToGrid
        snapGrid={[16, 16]}
        deleteKeyCode={null}
        multiSelectionKeyCode={null}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.4} className="mf-bg" />
        <Controls className="mf-controls" showInteractive={false} />
        <MiniMap
          className="mf-minimap"
          pannable
          zoomable
          nodeColor={(n) => (n.data as { color?: string })?.color ?? "#6366f1"}
          maskColor="rgba(10,12,20,0.55)"
        />
      </ReactFlow>
    </div>
  );
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <InnerCanvas />
    </ReactFlowProvider>
  );
}
