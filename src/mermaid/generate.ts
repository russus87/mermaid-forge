import type { Direction, FlowEdge, FlowNode, ShapeKind } from "../types";

/** Wrap a node label in the Mermaid bracket syntax for its shape. */
function shapeWrap(shape: ShapeKind, label: string): string {
  const t = `"${label.replace(/"/g, "&quot;")}"`;
  switch (shape) {
    case "rectangle":
      return `[${t}]`;
    case "rounded":
      return `(${t})`;
    case "stadium":
      return `([${t}])`;
    case "subroutine":
      return `[[${t}]]`;
    case "cylinder":
      return `[(${t})]`;
    case "circle":
      return `((${t}))`;
    case "doublecircle":
      return `(((${t})))`;
    case "rhombus":
      return `{${t}}`;
    case "hexagon":
      return `{{${t}}}`;
    case "parallelogram":
      return `[/${t}/]`;
    case "trapezoid":
      return `[/${t}\\]`;
    default:
      return `[${t}]`;
  }
}

/** Mermaid-safe node id (alphanumeric + underscore). */
export function safeId(id: string): string {
  const clean = id.replace(/[^a-zA-Z0-9_]/g, "_");
  return /^[a-zA-Z_]/.test(clean) ? clean : `n_${clean}`;
}

/** Build the arrow token for an edge, honoring style + inline label. */
function arrow(style: string | undefined, label?: string): string {
  const l = label ? `|"${label.replace(/"/g, "&quot;")}"|` : "";
  if (style === "dotted") return `-.->${l}`;
  if (style === "thick") return `==>${l}`;
  return `-->${l}`;
}

/**
 * Convert the visual graph into Mermaid `flowchart` source.
 * Node colors are emitted as `style` lines so the rendered Mermaid
 * preview matches the canvas accents.
 */
export function generateMermaid(
  direction: Direction,
  nodes: FlowNode[],
  edges: FlowEdge[],
): string {
  const lines: string[] = [`flowchart ${direction}`];

  // Node declarations
  for (const n of nodes) {
    const id = safeId(n.id);
    const label = n.data.kind
      ? `${n.data.kind}: ${n.data.label}`
      : n.data.label;
    lines.push(`    ${id}${shapeWrap(n.data.shape, label)}`);
  }

  if (nodes.length && edges.length) lines.push("");

  // Edges
  for (const e of edges) {
    const a = safeId(e.source);
    const b = safeId(e.target);
    lines.push(`    ${a} ${arrow(e.data?.style, e.data?.label)} ${b}`);
  }

  // Styling
  const styled = nodes.filter((n) => n.data.color);
  if (styled.length) {
    lines.push("");
    for (const n of styled) {
      const id = safeId(n.id);
      const c = n.data.color!;
      lines.push(
        `    style ${id} fill:${hexFill(c)},stroke:${c},stroke-width:2px,color:${contrast(c)}`,
      );
    }
  }

  return lines.join("\n");
}

/** Lighten a hex color into a soft fill for the Mermaid preview. */
function hexFill(hex: string): string {
  const { r, g, b } = parseHex(hex);
  const mix = (c: number) => Math.round(c + (255 - c) * 0.82);
  return rgbToHex(mix(r), mix(g), mix(b));
}

function contrast(hex: string): string {
  const { r, g, b } = parseHex(hex);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "#1e293b" : "#0f172a";
}

function parseHex(hex: string) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
