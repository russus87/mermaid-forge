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
import { getHelperLines } from "../mermaid/helperLines";
import { detectDiagramType } from "../mermaid/detect";
import type { Template } from "../mermaid/templates";

export type Theme = "dark" | "light";
export type Mode = "visual" | "code";

interface Snapshot {
  nodes: FlowNode[];
  edges: FlowEdge[];
  direction: Direction;
}

interface HelperLines {
  horizontal: number | null;
  vertical: number | null;
}

interface Clipboard {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface PersistedState {
  version: number;
  mode: Mode;
  theme: Theme;
  rawCode: string;
  snapshot: Snapshot;
}

interface State extends Snapshot {
  theme: Theme;
  mode: Mode;
  rawCode: string;
  codeDiagramType: string;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  filePath: string | null;
  dirty: boolean;
  past: Snapshot[];
  future: Snapshot[];
  clipboard: Clipboard | null;
  helperLines: HelperLines;

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

  // clipboard
  copySelection: () => void;
  cutSelection: () => void;
  paste: () => void;
  duplicateSelection: () => void;
  selectAll: () => void;

  setDirection: (d: Direction) => void;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  relayout: () => void;

  // code <-> graph & modes
  applyCode: (code: string) => { ok: boolean; error?: string };
  currentCode: () => string;
  setMode: (m: Mode) => void;
  enterCodeMode: (code: string) => void;
  setRawCode: (code: string) => void;
  importMermaid: (code: string) => { ok: boolean; error?: string; mode: Mode };
  loadTemplate: (t: Template) => void;

  // history
  commit: () => void;
  undo: () => void;
  redo: () => void;

  // file lifecycle
  newDiagram: () => void;
  loadSnapshot: (s: Snapshot, filePath?: string | null) => void;
  setFilePath: (p: string | null) => void;
  markSaved: () => void;

  // persistence
  getPersisted: () => PersistedState;
  hydrate: (data: PersistedState) => void;
}

const HISTORY_LIMIT = 80;
const NO_LINES: HelperLines = { horizontal: null, vertical: null };

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
    { id: "ingress", type: "shape", position: { x: 320, y: 40 }, data: { label: "apps.example.com", shape: "stadium", kind: "Route", color: "#16a34a", icon: "Globe" } },
    { id: "svc", type: "shape", position: { x: 320, y: 200 }, data: { label: "frontend", shape: "rounded", kind: "Service", color: "#0891b2", icon: "Network" } },
    { id: "deploy", type: "shape", position: { x: 320, y: 360 }, data: { label: "frontend", shape: "subroutine", kind: "Deployment", color: "#2563eb", icon: "Layers" } },
    { id: "pod1", type: "shape", position: { x: 140, y: 520 }, data: { label: "frontend-7d4", shape: "rounded", kind: "Pod", color: "#326ce5", icon: "Box" } },
    { id: "pod2", type: "shape", position: { x: 500, y: 520 }, data: { label: "frontend-9b1", shape: "rounded", kind: "Pod", color: "#326ce5", icon: "Box" } },
  ],
  edges: [
    { id: "e1", source: "ingress", target: "svc", data: { style: "solid" } },
    { id: "e2", source: "svc", target: "deploy", data: { style: "solid" } },
    { id: "e3", source: "deploy", target: "pod1", data: { style: "dotted" } },
    { id: "e4", source: "deploy", target: "pod2", data: { style: "dotted" } },
  ],
};

function remapClone(clip: Clipboard, offset: number): { nodes: FlowNode[]; edges: FlowEdge[]; lastId: string } {
  const idMap = new Map<string, string>();
  const nodes = clip.nodes.map((orig) => {
    const base = orig.id.replace(/-[A-Za-z0-9_]{5}$/, "");
    const nid = `${base}-${nanoid(5)}`;
    idMap.set(orig.id, nid);
    return {
      ...structuredClone(orig),
      id: nid,
      position: { x: orig.position.x + offset, y: orig.position.y + offset },
      selected: true,
    };
  });
  const edges = clip.edges
    .filter((e) => idMap.has(e.source) && idMap.has(e.target))
    .map((e) => ({
      ...structuredClone(e),
      id: `e-${nanoid(6)}`,
      source: idMap.get(e.source)!,
      target: idMap.get(e.target)!,
      selected: false,
    }));
  return { nodes, edges, lastId: nodes[nodes.length - 1]?.id ?? "" };
}

export const useStore = create<State>((set, get) => ({
  ...structuredClone(STARTER),
  theme: "dark",
  mode: "visual",
  rawCode: "",
  codeDiagramType: "flowchart",
  selectedNodeId: null,
  selectedEdgeId: null,
  filePath: null,
  dirty: false,
  past: [],
  future: [],
  clipboard: null,
  helperLines: NO_LINES,

  onNodesChange: (changes) =>
    set((s) => {
      let nodes = applyNodeChanges(changes, s.nodes);
      let helperLines = s.helperLines;

      const dragChanges = changes.filter(
        (c): c is Extract<NodeChange<FlowNode>, { type: "position" }> =>
          c.type === "position" && !!c.dragging && !!c.position,
      );

      if (dragChanges.length === 1) {
        const dc = dragChanges[0];
        const dragged = nodes.find((nd) => nd.id === dc.id);
        if (dragged && dc.position) {
          const hl = getHelperLines({ ...dragged, position: dc.position }, nodes);
          const snapped = { x: hl.snapX ?? dc.position.x, y: hl.snapY ?? dc.position.y };
          nodes = nodes.map((nd) => (nd.id === dc.id ? { ...nd, position: snapped } : nd));
          helperLines = { horizontal: hl.horizontal ?? null, vertical: hl.vertical ?? null };
        }
      } else if (changes.some((c) => c.type === "position" && !c.dragging)) {
        helperLines = NO_LINES;
      }

      return { nodes, helperLines, dirty: true };
    }),

  onEdgesChange: (changes) =>
    set((s) => ({ edges: applyEdgeChanges(changes, s.edges), dirty: true })),

  onConnect: (c) => {
    get().commit();
    set((s) => ({
      edges: addEdge({ ...c, id: `e-${nanoid(6)}`, data: { style: "solid" } }, s.edges) as FlowEdge[],
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
      nodes: s.nodes.map((nd) => (nd.id === id ? { ...nd, data: { ...nd.data, ...patch } } : nd)),
      dirty: true,
    }));
  },

  updateEdge: (id, patch) => {
    get().commit();
    set((s) => ({
      edges: s.edges.map((e) => (e.id === id ? { ...e, data: { ...e.data, ...patch } } : e)),
      dirty: true,
    }));
  },

  setEdgeStyle: (id, style) => get().updateEdge(id, { style }),
  setEdgeLabel: (id, label) => get().updateEdge(id, { label }),

  deleteSelected: () => {
    const { nodes, edges, selectedNodeId, selectedEdgeId } = get();
    const nodeIds = new Set(nodes.filter((nd) => nd.selected).map((nd) => nd.id));
    if (selectedNodeId) nodeIds.add(selectedNodeId);
    const edgeIds = new Set(edges.filter((e) => e.selected).map((e) => e.id));
    if (selectedEdgeId) edgeIds.add(selectedEdgeId);
    if (!nodeIds.size && !edgeIds.size) return;
    get().commit();
    set((s) => ({
      nodes: s.nodes.filter((nd) => !nodeIds.has(nd.id)),
      edges: s.edges.filter(
        (e) => !edgeIds.has(e.id) && !nodeIds.has(e.source) && !nodeIds.has(e.target),
      ),
      selectedNodeId: null,
      selectedEdgeId: null,
      dirty: true,
    }));
  },

  select: (nodeId, edgeId = null) => set({ selectedNodeId: nodeId, selectedEdgeId: edgeId }),

  copySelection: () => {
    const { nodes, edges, selectedNodeId } = get();
    const ids = new Set(nodes.filter((nd) => nd.selected).map((nd) => nd.id));
    if (selectedNodeId) ids.add(selectedNodeId);
    if (!ids.size) return;
    set({
      clipboard: {
        nodes: structuredClone(nodes.filter((nd) => ids.has(nd.id))),
        edges: structuredClone(edges.filter((e) => ids.has(e.source) && ids.has(e.target))),
      },
    });
  },

  cutSelection: () => {
    get().copySelection();
    get().deleteSelected();
  },

  paste: () => {
    const clip = get().clipboard;
    if (!clip || !clip.nodes.length) return;
    get().commit();
    const { nodes, edges, lastId } = remapClone(clip, 36);
    set((s) => ({
      nodes: [...s.nodes.map((nd) => ({ ...nd, selected: false })), ...nodes],
      edges: [...s.edges, ...edges],
      selectedNodeId: lastId || null,
      dirty: true,
    }));
  },

  duplicateSelection: () => {
    const { nodes, edges, selectedNodeId } = get();
    const ids = new Set(nodes.filter((nd) => nd.selected).map((nd) => nd.id));
    if (selectedNodeId) ids.add(selectedNodeId);
    if (!ids.size) return;
    const clip: Clipboard = {
      nodes: structuredClone(nodes.filter((nd) => ids.has(nd.id))),
      edges: structuredClone(edges.filter((e) => ids.has(e.source) && ids.has(e.target))),
    };
    get().commit();
    const cloned = remapClone(clip, 36);
    set((s) => ({
      nodes: [...s.nodes.map((nd) => ({ ...nd, selected: false })), ...cloned.nodes],
      edges: [...s.edges, ...cloned.edges],
      selectedNodeId: cloned.lastId || null,
      dirty: true,
    }));
  },

  selectAll: () =>
    set((s) => ({ nodes: s.nodes.map((nd) => ({ ...nd, selected: true })) })),

  setDirection: (d) => {
    get().commit();
    set({ direction: d, dirty: true });
  },

  setTheme: (t) => set({ theme: t }),
  toggleTheme: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),

  relayout: () => {
    get().commit();
    set((s) => ({ nodes: layeredLayout(s.nodes, s.edges, s.direction), dirty: true }));
  },

  applyCode: (code) => {
    const res = parseMermaid(code);
    if (res.error) return { ok: false, error: res.error };
    get().commit();
    set({
      nodes: layeredLayout(res.nodes, res.edges, res.direction),
      edges: res.edges,
      direction: res.direction,
      mode: "visual",
      selectedNodeId: null,
      selectedEdgeId: null,
      dirty: true,
    });
    return { ok: true };
  },

  currentCode: () => {
    const s = get();
    return s.mode === "code" ? s.rawCode : generateMermaid(s.direction, s.nodes, s.edges);
  },

  setMode: (m) => set({ mode: m }),

  enterCodeMode: (code) =>
    set({ mode: "code", rawCode: code, codeDiagramType: detectDiagramType(code), dirty: true }),

  setRawCode: (code) =>
    set({ rawCode: code, codeDiagramType: detectDiagramType(code), dirty: true }),

  importMermaid: (code) => {
    const res = parseMermaid(code);
    if (!res.error) {
      get().applyCode(code);
      return { ok: true, mode: "visual" };
    }
    get().enterCodeMode(code);
    return { ok: true, mode: "code" };
  },

  loadTemplate: (t) => {
    get().commit();
    if (t.mode === "visual") {
      set({
        mode: "visual",
        direction: t.direction,
        nodes: structuredClone(t.nodes),
        edges: structuredClone(t.edges),
        selectedNodeId: null,
        selectedEdgeId: null,
        filePath: null,
        dirty: true,
      });
    } else {
      set({
        mode: "code",
        rawCode: t.code,
        codeDiagramType: t.diagramType,
        filePath: null,
        dirty: true,
      });
    }
  },

  commit: () =>
    set((s) => ({ past: [...s.past, snapshot(s)].slice(-HISTORY_LIMIT), future: [] })),

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
      mode: "visual",
      direction: "TB",
      nodes: [],
      edges: [],
      rawCode: "",
      selectedNodeId: null,
      selectedEdgeId: null,
      filePath: null,
      dirty: false,
    });
  },

  loadSnapshot: (snap, filePath = null) =>
    set({
      mode: "visual",
      direction: snap.direction,
      nodes: structuredClone(snap.nodes),
      edges: structuredClone(snap.edges),
      selectedNodeId: null,
      selectedEdgeId: null,
      filePath,
      dirty: false,
      past: [],
      future: [],
    }),

  setFilePath: (p) => set({ filePath: p }),
  markSaved: () => set({ dirty: false }),

  getPersisted: () => {
    const s = get();
    return {
      version: 1,
      mode: s.mode,
      theme: s.theme,
      rawCode: s.rawCode,
      snapshot: { direction: s.direction, nodes: s.nodes, edges: s.edges },
    };
  },

  hydrate: (data) => {
    if (!data || data.version !== 1) return;
    set({
      theme: data.theme ?? "dark",
      mode: data.mode ?? "visual",
      rawCode: data.rawCode ?? "",
      codeDiagramType: detectDiagramType(data.rawCode ?? ""),
      direction: data.snapshot?.direction ?? "TB",
      nodes: structuredClone(data.snapshot?.nodes ?? []),
      edges: structuredClone(data.snapshot?.edges ?? []),
      dirty: false,
      past: [],
      future: [],
    });
  },
}));
