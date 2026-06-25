import { create } from "zustand";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { nanoid } from "nanoid";

import type {
  Direction,
  FlowEdge,
  FlowNode,
  ShapeNodeData,
} from "../types";
import { PALETTE_INDEX } from "../mermaid/nodeCatalog";
import { parseMermaid } from "../mermaid/parse";
import { layeredLayout } from "../mermaid/layout";
import { generateMermaid } from "../mermaid/generate";

export type Theme = "dark" | "light";

interface Snapshot {
  nodes: FlowNode[];
  edges: FlowEdge[];
  direction: Direction;
}

interface State extends Snapshot {
  theme: Theme;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  filePath: string | null;
  dirty: boolean;
  past: Snapshot[];
  future: Snapshot[];

  // React Flow handlers
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void;
  onConnect: (c: Connection) => void;

  // graph mutations
  addNodeFromPalette: (itemId: string, position: { x: number; y: number }) => void;
  addBlankNode: (position: { x: number; y: number }) => void;
  updateNodeData: (id: string, patch: Partial<ShapeNodeData>) => void;
  updateEdge: (id: string, patch: { label?: string; style?: "solid" | "dotted" | "thick" }) => void;
  setEdgeStyle: (id: string, style: "solid" | "dotted" | "thick") => void;
  setEdgeLabel: (id: string, label: string) => void;
  deleteSelected: () => void;
  select: (nodeId: string | null, edgeId?: string | null) => void;

  setDirection: (d: Direction) => void;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;

  // code <-> graph
  applyCode: (code: string) => { ok: boolean; error?: string };
  currentCode: () => string;

  // history
  commit: () => void;
  undo: () => void;
  redo: () => void;

  // file lifecycle
  newDiagram: () => void;
  loadSnapshot: (s: Snapshot, filePath?: string | null) => void;
  setFilePath: (p: string | null) => void;
  markSaved: () => void;
}

const HISTORY_LIMIT = 80;

function snapshot(s: State): Snapshot {
  return {
    nodes: structuredClone(s.nodes),
    edges: structuredClone(s.edges),
    direction: s.direction,
  };
}

const STARTER: Snapshot = {
  direction: "TB",
  nodes: [
    {
      id: "ingress",
      type: "shape",
      position: { x: 320, y: 40 },
      data: { label: "apps.example.com", shape: "stadium", kind: "Route", color: "#16a34a", icon: "Globe" },
    },
    {
      id: "svc",
      type: "shape",
      position: { x: 320, y: 200 },
      data: { label: "frontend", shape: "rounded", kind: "Service", color: "#0891b2", icon: "Network" },
    },
    {
      id: "deploy",
      type: "shape",
      position: { x: 320, y: 360 },
      data: { label: "frontend", shape: "subroutine", kind: "Deployment", color: "#2563eb", icon: "Layers" },
    },
    {
      id: "pod1",
      type: "shape",
      position: { x: 140, y: 520 },
      data: { label: "frontend-7d4", shape: "rounded", kind: "Pod", color: "#326ce5", icon: "Box" },
    },
    {
      id: "pod2",
      type: "shape",
      position: { x: 500, y: 520 },
      data: { label: "frontend-9b1", shape: "rounded", kind: "Pod", color: "#326ce5", icon: "Box" },
    },
  ],
  edges: [
    { id: "e1", source: "ingress", target: "svc", data: { style: "solid" } },
    { id: "e2", source: "svc", target: "deploy", data: { style: "solid" } },
    { id: "e3", source: "deploy", target: "pod1", data: { style: "dotted" } },
    { id: "e4", source: "deploy", target: "pod2", data: { style: "dotted" } },
  ],
};

export const useStore = create<State>((set, get) => ({
  ...structuredClone(STARTER),
  theme: "dark",
  selectedNodeId: null,
  selectedEdgeId: null,
  filePath: null,
  dirty: false,
  past: [],
  future: [],

  onNodesChange: (changes) =>
    set((s) => ({ nodes: applyNodeChanges(changes, s.nodes), dirty: true })),

  onEdgesChange: (changes) =>
    set((s) => ({ edges: applyEdgeChanges(changes, s.edges), dirty: true })),

  onConnect: (c) => {
    get().commit();
    set((s) => ({
      edges: addEdge(
        { ...c, id: `e-${nanoid(6)}`, data: { style: "solid" } },
        s.edges,
      ) as FlowEdge[],
      dirty: true,
    }));
  },

  addNodeFromPalette: (itemId, position) => {
    const item = PALETTE_INDEX[itemId];
    if (!item) return;
    get().commit();
    const id = `${item.id}-${nanoid(5)}`;
    const node: FlowNode = {
      id,
      type: "shape",
      position,
      data: {
        label: item.label,
        shape: item.shape,
        color: item.color,
        icon: item.icon,
        kind: item.kind,
        subtitle: item.subtitle,
      },
    };
    set((s) => ({ nodes: [...s.nodes, node], selectedNodeId: id, dirty: true }));
  },

  addBlankNode: (position) => {
    get().commit();
    const id = `node-${nanoid(5)}`;
    const node: FlowNode = {
      id,
      type: "shape",
      position,
      data: { label: "New node", shape: "rounded", color: "#6366f1", icon: "Square" },
    };
    set((s) => ({ nodes: [...s.nodes, node], selectedNodeId: id, dirty: true }));
  },

  updateNodeData: (id, patch) => {
    get().commit();
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...patch } } : n,
      ),
      dirty: true,
    }));
  },

  updateEdge: (id, patch) => {
    get().commit();
    set((s) => ({
      edges: s.edges.map((e) =>
        e.id === id ? { ...e, data: { ...e.data, ...patch } } : e,
      ),
      dirty: true,
    }));
  },

  setEdgeStyle: (id, style) => get().updateEdge(id, { style }),
  setEdgeLabel: (id, label) => get().updateEdge(id, { label }),

  deleteSelected: () => {
    const { selectedNodeId, selectedEdgeId } = get();
    if (!selectedNodeId && !selectedEdgeId) return;
    get().commit();
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== selectedNodeId),
      edges: s.edges.filter(
        (e) =>
          e.id !== selectedEdgeId &&
          e.source !== selectedNodeId &&
          e.target !== selectedNodeId,
      ),
      selectedNodeId: null,
      selectedEdgeId: null,
      dirty: true,
    }));
  },

  select: (nodeId, edgeId = null) =>
    set({ selectedNodeId: nodeId, selectedEdgeId: edgeId }),

  setDirection: (d) => {
    get().commit();
    set({ direction: d, dirty: true });
  },

  setTheme: (t) => set({ theme: t }),
  toggleTheme: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),

  applyCode: (code) => {
    const res = parseMermaid(code);
    if (res.error) return { ok: false, error: res.error };
    get().commit();
    const laid = layeredLayout(res.nodes, res.edges, res.direction);
    set({
      nodes: laid,
      edges: res.edges,
      direction: res.direction,
      selectedNodeId: null,
      selectedEdgeId: null,
      dirty: true,
    });
    return { ok: true };
  },

  currentCode: () => {
    const s = get();
    return generateMermaid(s.direction, s.nodes, s.edges);
  },

  commit: () =>
    set((s) => ({
      past: [...s.past, snapshot(s)].slice(-HISTORY_LIMIT),
      future: [],
    })),

  undo: () =>
    set((s) => {
      if (!s.past.length) return s;
      const prev = s.past[s.past.length - 1];
      return {
        ...prev,
        past: s.past.slice(0, -1),
        future: [snapshot(s), ...s.future].slice(0, HISTORY_LIMIT),
        dirty: true,
      };
    }),

  redo: () =>
    set((s) => {
      if (!s.future.length) return s;
      const next = s.future[0];
      return {
        ...next,
        past: [...s.past, snapshot(s)].slice(-HISTORY_LIMIT),
        future: s.future.slice(1),
        dirty: true,
      };
    }),

  newDiagram: () => {
    get().commit();
    set({
      direction: "TB",
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      filePath: null,
      dirty: false,
    });
  },

  loadSnapshot: (snap, filePath = null) => {
    set({
      direction: snap.direction,
      nodes: structuredClone(snap.nodes),
      edges: structuredClone(snap.edges),
      selectedNodeId: null,
      selectedEdgeId: null,
      filePath,
      dirty: false,
      past: [],
      future: [],
    });
  },

  setFilePath: (p) => set({ filePath: p }),
  markSaved: () => set({ dirty: false }),
}));
