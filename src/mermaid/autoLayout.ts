import dagre from "@dagrejs/dagre";
import type { Direction, FlowEdge, FlowNode } from "../types";
import { nodeSize, parentsFirst } from "./groups";

/**
 * Compound (subgraph-aware) auto-layout powered by dagre. Group nodes become
 * dagre clusters; their children are laid out inside and then converted back
 * to React Flow's parent-relative coordinates.
 */
export function autoLayout(
  nodes: FlowNode[],
  edges: FlowEdge[],
  direction: Direction,
): FlowNode[] {
  if (!nodes.length) return nodes;

  const g = new dagre.graphlib.Graph({ compound: true });
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80, marginx: 24, marginy: 24 });
  g.setDefaultEdgeLabel(() => ({}));

  const groups = new Set(nodes.filter((n) => n.data.group).map((n) => n.id));

  // Count children so empty groups are laid out as plain boxes (dagre cannot
  // rank an empty cluster, and edges to a cluster node crash ranking).
  const childCount = new Map<string, number>();
  for (const n of nodes) {
    if (n.parentId && groups.has(n.parentId)) {
      childCount.set(n.parentId, (childCount.get(n.parentId) ?? 0) + 1);
    }
  }
  const cluster = (id: string) => groups.has(id) && (childCount.get(id) ?? 0) > 0;

  for (const n of nodes) {
    if (cluster(n.id)) {
      g.setNode(n.id, { label: n.data.label });
    } else {
      const { w, h } = n.data.group
        ? { w: (n.width as number) ?? 220, h: (n.height as number) ?? 140 }
        : nodeSize(n);
      g.setNode(n.id, { width: w, height: h });
    }
  }
  for (const n of nodes) {
    if (n.parentId && cluster(n.parentId)) g.setParent(n.id, n.parentId);
  }
  for (const e of edges) {
    // Edges to/from a cluster node break dagre's ranking — skip them.
    if (cluster(e.source) || cluster(e.target)) continue;
    if (g.hasNode(e.source) && g.hasNode(e.target)) g.setEdge(e.source, e.target);
  }

  dagre.layout(g);

  // Absolute top-left for every node from dagre's centered coordinates.
  const abs = new Map<string, { x: number; y: number; w: number; h: number }>();
  for (const n of nodes) {
    const dn = g.node(n.id);
    if (!dn) continue;
    abs.set(n.id, { x: dn.x - dn.width / 2, y: dn.y - dn.height / 2, w: dn.width, h: dn.height });
  }

  const laid = nodes.map((n) => {
    const a = abs.get(n.id);
    if (!a) return n;
    if (n.data.group) {
      return { ...n, position: { x: a.x, y: a.y }, width: a.w, height: a.h };
    }
    if (n.parentId && abs.has(n.parentId)) {
      const p = abs.get(n.parentId)!;
      return { ...n, position: { x: a.x - p.x, y: a.y - p.y } };
    }
    return { ...n, position: { x: a.x, y: a.y } };
  });

  return parentsFirst(laid);
}
