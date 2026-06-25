import type { FlowNode } from "../types";

const DEFAULT_W = 190;
const DEFAULT_H = 90;

function size(n: FlowNode): { w: number; h: number } {
  const m = (n as { measured?: { width?: number; height?: number } }).measured;
  return { w: m?.width ?? DEFAULT_W, h: m?.height ?? DEFAULT_H };
}

export interface HelperLineResult {
  horizontal?: number;
  vertical?: number;
  snapX?: number;
  snapY?: number;
}

/**
 * Given the node currently being dragged (id + tentative position), find
 * alignment guides against every other node and return snapped coordinates.
 * Guides are reported in flow coordinates and drawn via a ViewportPortal.
 */
export function getHelperLines(
  dragged: FlowNode,
  nodes: FlowNode[],
  distance = 6,
): HelperLineResult {
  const a = size(dragged);
  const ax = dragged.position.x;
  const ay = dragged.position.y;
  const aEdges = {
    left: ax,
    right: ax + a.w,
    centerX: ax + a.w / 2,
    top: ay,
    bottom: ay + a.h,
    centerY: ay + a.h / 2,
  };

  const result: HelperLineResult = {};
  let bestV = distance;
  let bestH = distance;

  for (const n of nodes) {
    if (n.id === dragged.id) continue;
    const b = size(n);
    const bEdges = {
      left: n.position.x,
      right: n.position.x + b.w,
      centerX: n.position.x + b.w / 2,
      top: n.position.y,
      bottom: n.position.y + b.h,
      centerY: n.position.y + b.h / 2,
    };

    // Vertical guides (align X): left-left, right-right, center-center.
    const vChecks: [number, number, number][] = [
      [aEdges.left, bEdges.left, bEdges.left],
      [aEdges.right, bEdges.right, bEdges.right - a.w],
      [aEdges.centerX, bEdges.centerX, bEdges.centerX - a.w / 2],
      [aEdges.left, bEdges.right, bEdges.right],
      [aEdges.right, bEdges.left, bEdges.left - a.w],
    ];
    for (const [edge, guide, snap] of vChecks) {
      const d = Math.abs(edge - guide);
      if (d < bestV) {
        bestV = d;
        result.vertical = guide;
        result.snapX = snap;
      }
    }

    // Horizontal guides (align Y).
    const hChecks: [number, number, number][] = [
      [aEdges.top, bEdges.top, bEdges.top],
      [aEdges.bottom, bEdges.bottom, bEdges.bottom - a.h],
      [aEdges.centerY, bEdges.centerY, bEdges.centerY - a.h / 2],
      [aEdges.top, bEdges.bottom, bEdges.bottom],
      [aEdges.bottom, bEdges.top, bEdges.top - a.h],
    ];
    for (const [edge, guide, snap] of hChecks) {
      const d = Math.abs(edge - guide);
      if (d < bestH) {
        bestH = d;
        result.horizontal = guide;
        result.snapY = snap;
      }
    }
  }

  return result;
}
