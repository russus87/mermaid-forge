import type {
  ArrowDir,
  Direction,
  EdgeLineStyle,
  FlowEdge,
  FlowNode,
  ShapeKind,
} from "../types";

/** Wrap a node label in the Mermaid bracket syntax for its shape. */
function shapeWrap(shape: ShapeKind, label: string): string {
  const t = `"${label.replace(/"/g, "&quot;")}"`;
  switch (shape) {
    case "rectangle": return `[${t}]`;
    case "rounded": return `(${t})`;
    case "stadium": return `([${t}])`;
    case "subroutine": return `[[${t}]]`;
    case "cylinder": return `[(${t})]`;
    case "circle": return `((${t}))`;
    case "doublecircle": return `(((${t})))`;
    case "rhombus": return `{${t}}`;
    case "hexagon": return `{{${t}}}`;
    case "parallelogram": return `[/${t}/]`;
    case "trapezoid": return `[/${t}\\]`;
    default: return `[${t}]`;
  }
}

/** Mermaid-safe node id (alphanumeric + underscore). */
export function safeId(id: string): string {
  const clean = id.replace(/[^a-zA-Z0-9_]/g, "_");
  return /^[a-zA-Z_]/.test(clean) ? clean : `n_${clean}`;
}

const CONNECTORS: Record<EdgeLineStyle, Record<ArrowDir, string>> = {
  solid: { end: "-->", both: "<-->", start: "<--", none: "---" },
  dotted: { end: "-.->", both: "<-.->", start: "<-.-", none: "-.-" },
  thick: { end: "==>", both: "<==>", start: "<==", none: "===" },
};

/** Build the connector token for an edge, honoring style, arrows and label. */
function arrow(style: EdgeLineStyle | undefined, dir: ArrowDir | undefined, label?: string): string {
  const token = CONNECTORS[style ?? "solid"][dir ?? "end"];
  const l = label ? `|"${label.replace(/"/g, "&quot;")}"|` : "";
  return `${token}${l}`;
}

function nodeLabel(n: FlowNode): string {
  return n.data.kind ? `${n.data.kind}: ${n.data.label}` : n.data.label;
}

/**
 * Convert the visual graph into Mermaid `flowchart` source. Container
 * ("group") nodes become `subgraph` blocks wrapping their children; node
 * colors are emitted as `style` lines so the preview matches the canvas.
 */
export function generateMermaid(
  direction: Direction,
  nodes: FlowNode[],
  edges: FlowEdge[],
): string {
  const lines: string[] = [`flowchart ${direction}`];

  const groups = nodes.filter((n) => n.data.group);
  const groupIds = new Set(groups.map((g) => g.id));
  const childrenOf = (gid: string) => nodes.filter((n) => n.parentId === gid && !n.data.group);

  const declShape = (n: FlowNode, indent: string) =>
    lines.push(`${indent}${safeId(n.id)}${shapeWrap(n.data.shape, nodeLabel(n))}`);

  // Top-level shape nodes (no parent, not a group).
  for (const n of nodes) {
    if (n.data.group || (n.parentId && groupIds.has(n.parentId))) continue;
    declShape(n, "    ");
  }

  // Subgraph blocks.
  for (const g of groups) {
    const label = nodeLabel(g);
    lines.push(`    subgraph ${safeId(g.id)}["${label.replace(/"/g, "&quot;")}"]`);
    for (const child of childrenOf(g.id)) declShape(child, "        ");
    lines.push("    end");
  }

  if (nodes.length && edges.length) lines.push("");

  for (const e of edges) {
    lines.push(`    ${safeId(e.source)} ${arrow(e.data?.style, e.data?.arrow, e.data?.label)} ${safeId(e.target)}`);
  }

  const styled = nodes.filter((n) => n.data.color);
  if (styled.length) {
    lines.push("");
    for (const n of styled) {
      const c = n.data.color!;
      lines.push(
        `    style ${safeId(n.id)} fill:${hexFill(c)},stroke:${c},stroke-width:2px,color:${contrast(c)}`,
      );
    }
  }

  return lines.join("\n");
}

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
