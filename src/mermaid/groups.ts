import { nanoid } from "nanoid";
import type { FlowNode } from "../types";

export const GROUP_PADDING = 26;
export const GROUP_HEADER = 34;
const DEFAULT_W = 190;
const DEFAULT_H = 90;

export function nodeSize(n: FlowNode): { w: number; h: number } {
  const m = (n as { measured?: { width?: number; height?: number } }).measured;
  return {
    w: m?.width ?? (n.width as number | undefined) ?? DEFAULT_W,
    h: m?.height ?? (n.height as number | undefined) ?? DEFAULT_H,
  };
}

/** Absolute position of a node, resolving a single level of parenting. */
export function absolutePos(n: FlowNode, byId: Map<string, FlowNode>): { x: number; y: number } {
  if (n.parentId) {
    const p = byId.get(n.parentId);
    if (p) return { x: p.position.x + n.position.x, y: p.position.y + n.position.y };
  }
  return { x: n.position.x, y: n.position.y };
}

/** Ensure parents are listed before their children (React Flow requirement). */
export function parentsFirst(nodes: FlowNode[]): FlowNode[] {
  return [...nodes].sort((a, b) => {
    const ag = a.data.group ? 0 : 1;
    const bg = b.data.group ? 0 : 1;
    return ag - bg;
  });
}

/**
 * Wrap the given top-level nodes in a new container ("group") node. Children
 * are reparented with positions made relative to the new container.
 */
export function groupSelection(
  nodes: FlowNode[],
  selectedIds: string[],
  title = "Group",
): FlowNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const members = selectedIds
    .map((id) => byId.get(id))
    .filter((n): n is FlowNode => !!n && !n.data.group && !n.parentId);
  if (members.length < 1) return nodes;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const m of members) {
    const { w, h } = nodeSize(m);
    minX = Math.min(minX, m.position.x);
    minY = Math.min(minY, m.position.y);
    maxX = Math.max(maxX, m.position.x + w);
    maxY = Math.max(maxY, m.position.y + h);
  }

  const groupId = `group-${nanoid(5)}`;
  const gx = minX - GROUP_PADDING;
  const gy = minY - GROUP_PADDING - GROUP_HEADER;
  const group: FlowNode = {
    id: groupId,
    type: "group",
    position: { x: gx, y: gy },
    width: maxX - minX + GROUP_PADDING * 2,
    height: maxY - minY + GROUP_PADDING * 2 + GROUP_HEADER,
    data: { label: title, shape: "rectangle", kind: "Namespace", color: "#cc0000", group: true },
  };

  const memberIds = new Set(members.map((m) => m.id));
  const reparented = nodes.map((n) =>
    memberIds.has(n.id)
      ? { ...n, parentId: groupId, extent: "parent" as const, position: { x: n.position.x - gx, y: n.position.y - gy } }
      : n,
  );

  return parentsFirst([group, ...reparented]);
}

/** Dissolve a group: children become top-level with absolute positions. */
export function ungroup(nodes: FlowNode[], groupId: string): FlowNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const group = byId.get(groupId);
  if (!group) return nodes;
  return nodes
    .filter((n) => n.id !== groupId)
    .map((n) =>
      n.parentId === groupId
        ? {
            ...n,
            parentId: undefined,
            extent: undefined,
            position: { x: group.position.x + n.position.x, y: group.position.y + n.position.y },
          }
        : n,
    );
}

/** Resize each group box to tightly fit its current children. */
export function refitGroups(nodes: FlowNode[]): FlowNode[] {
  return nodes.map((g) => {
    if (!g.data.group) return g;
    const children = nodes.filter((c) => c.parentId === g.id);
    if (!children.length) return g;
    let maxX = 0, maxY = 0;
    for (const c of children) {
      const { w, h } = nodeSize(c);
      maxX = Math.max(maxX, c.position.x + w);
      maxY = Math.max(maxY, c.position.y + h);
    }
    return {
      ...g,
      width: maxX + GROUP_PADDING,
      height: maxY + GROUP_PADDING,
    };
  });
}
