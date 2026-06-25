import type { Direction, FlowEdge, FlowNode } from "../types";

const NODE_W = 190;
const NODE_H = 90;
const GAP_X = 90;
const GAP_Y = 80;

/**
 * Lightweight layered (Sugiyama-style) layout. Assigns each node a depth
 * based on longest-path from roots, then spreads nodes within each layer.
 * Good enough to make imported Mermaid code readable without a heavy dep.
 */
export function layeredLayout(
  nodes: FlowNode[],
  edges: FlowEdge[],
  direction: Direction,
): FlowNode[] {
  if (!nodes.length) return nodes;

  const incoming = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const n of nodes) {
    incoming.set(n.id, 0);
    adj.set(n.id, []);
  }
  for (const e of edges) {
    if (!adj.has(e.source) || !incoming.has(e.target)) continue;
    adj.get(e.source)!.push(e.target);
    incoming.set(e.target, (incoming.get(e.target) ?? 0) + 1);
  }

  // Longest-path layering via Kahn's algorithm.
  const depth = new Map<string, number>();
  const queue: string[] = [];
  for (const n of nodes) {
    if ((incoming.get(n.id) ?? 0) === 0) {
      depth.set(n.id, 0);
      queue.push(n.id);
    }
  }
  const remaining = new Map(incoming);
  let head = 0;
  while (head < queue.length) {
    const u = queue[head++];
    const du = depth.get(u) ?? 0;
    for (const v of adj.get(u) ?? []) {
      depth.set(v, Math.max(depth.get(v) ?? 0, du + 1));
      remaining.set(v, (remaining.get(v) ?? 0) - 1);
      if ((remaining.get(v) ?? 0) === 0) queue.push(v);
    }
  }
  // Any nodes left unvisited (cycles) get depth 0.
  for (const n of nodes) if (!depth.has(n.id)) depth.set(n.id, 0);

  const layers = new Map<number, string[]>();
  for (const n of nodes) {
    const d = depth.get(n.id) ?? 0;
    if (!layers.has(d)) layers.set(d, []);
    layers.get(d)!.push(n.id);
  }

  const horizontal = direction === "LR" || direction === "RL";
  const pos = new Map<string, { x: number; y: number }>();
  const sortedDepths = [...layers.keys()].sort((a, b) => a - b);

  for (const d of sortedDepths) {
    const ids = layers.get(d)!;
    ids.forEach((id, idx) => {
      const main = d * ((horizontal ? NODE_W : NODE_H) + (horizontal ? GAP_X : GAP_Y));
      const cross = idx * ((horizontal ? NODE_H : NODE_W) + (horizontal ? GAP_Y : GAP_X));
      let x = horizontal ? main : cross;
      let y = horizontal ? cross : main;
      if (direction === "BT") y = -y;
      if (direction === "RL") x = -x;
      pos.set(id, { x: x + 80, y: y + 80 });
    });
  }

  return nodes.map((n) => ({ ...n, position: pos.get(n.id) ?? n.position }));
}

export const NODE_SIZE = { width: NODE_W, height: NODE_H };
