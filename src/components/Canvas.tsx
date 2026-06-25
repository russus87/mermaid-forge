import { useCallback, useRef } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  ViewportPortal,
  useReactFlow,
  type Edge,
  type EdgeTypes,
  type MarkerType,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { ShapeNode } from "./nodes/ShapeNode";
import { GroupNode } from "./nodes/GroupNode";
import { AlignmentToolbar } from "./AlignmentToolbar";
import { useStore } from "../store/useStore";
import type { FlowEdge } from "../types";

const nodeTypes: NodeTypes = { shape: ShapeNode, group: GroupNode };
const edgeTypes: EdgeTypes = {};

const CURVE_TYPE: Record<string, string> = {
  smooth: "smoothstep",
  straight: "straight",
  step: "step",
  bezier: "default",
};

function styleForEdge(e: FlowEdge): Edge {
  const variant = e.data?.style ?? "solid";
  const dir = e.data?.arrow ?? "end";
  const marker = { type: "arrowclosed" as MarkerType, color: "#8b93a7", width: 18, height: 18 };
  return {
    ...e,
    label: e.data?.label,
    type: CURVE_TYPE[e.data?.curve ?? "smooth"],
    animated: variant === "dotted",
    markerEnd: dir === "end" || dir === "both" ? marker : undefined,
    markerStart: dir === "start" || dir === "both" ? marker : undefined,
    style: {
      stroke: "var(--edge-color)",
      strokeWidth: variant === "thick" ? 3.5 : 2,
      strokeDasharray: variant === "dotted" ? "6 5" : undefined,
    },
    labelStyle: { fill: "var(--text)", fontWeight: 600, fontSize: 12 },
    labelBgStyle: { fill: "var(--panel)", fillOpacity: 0.9 },
    labelBgPadding: [6, 3] as [number, number],
    labelBgBorderRadius: 6,
  };
}

function HelperLines() {
  const helperLines = useStore((s) => s.helperLines);
  if (helperLines.horizontal == null && helperLines.vertical == null) return null;
  return (
    <ViewportPortal>
      {helperLines.vertical != null && (
        <div className="mf-guide mf-guide-v" style={{ transform: `translateX(${helperLines.vertical}px)` }} />
      )}
      {helperLines.horizontal != null && (
        <div className="mf-guide mf-guide-h" style={{ transform: `translateY(${helperLines.horizontal}px)` }} />
      )}
    </ViewportPortal>
  );
}

function InnerCanvas() {
  const wrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, getIntersectingNodes } = useReactFlow();

  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const onNodesChange = useStore((s) => s.onNodesChange);
  const onEdgesChange = useStore((s) => s.onEdgesChange);
  const onConnect = useStore((s) => s.onConnect);
  const addNodeFromPalette = useStore((s) => s.addNodeFromPalette);
  const addBlankNode = useStore((s) => s.addBlankNode);
  const addNodeWithEdge = useStore((s) => s.addNodeWithEdge);
  const reparentNode = useStore((s) => s.reparentNode);
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
        onConnectEnd={(event, conn) => {
          // Dropping a connection on empty canvas spawns a connected node.
          if (conn.isValid || !conn.fromNode) return;
          const p = "changedTouches" in event ? event.changedTouches[0] : (event as MouseEvent);
          const position = screenToFlowPosition({ x: p.clientX, y: p.clientY });
          addNodeWithEdge(conn.fromNode.id, conn.fromHandle?.id ?? null, position);
        }}
        onNodeDragStart={() => commit()}
        onNodeDragStop={(_, node) => {
          useStore.setState({ helperLines: { horizontal: null, vertical: null } });
          if (node.data?.group) return;
          const overGroup = getIntersectingNodes(node).find((n) => (n.data as { group?: boolean })?.group);
          reparentNode(node.id, overGroup ? overGroup.id : null);
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={(_, nd) => select(nd.id, null)}
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
        selectionOnDrag
        panOnDrag={[1, 2]}
        selectNodesOnDrag={false}
        deleteKeyCode={null}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.4} className="mf-bg" />
        <Controls className="mf-controls" showInteractive={false} />
        <MiniMap
          className="mf-minimap"
          pannable
          zoomable
          nodeColor={(nd) => (nd.data as { color?: string })?.color ?? "#6366f1"}
          maskColor="rgba(10,12,20,0.55)"
        />
        <HelperLines />
      </ReactFlow>
      <AlignmentToolbar />
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
