import type {
  Direction,
  EdgeLineStyle,
  FlowEdge,
  FlowNode,
  ShapeKind,
} from "../types";

interface ParsedNode {
  id: string;
  label: string;
  shape: ShapeKind;
  kind?: string;
  color?: string;
}

const SHAPE_PATTERNS: { re: RegExp; shape: ShapeKind }[] = [
  // Order matters: most specific (longest delimiters) first.
  { re: /^\(\(\((.*)\)\)\)$/, shape: "doublecircle" },
  { re: /^\(\((.*)\)\)$/, shape: "circle" },
  { re: /^\(\[(.*)\]\)$/, shape: "stadium" },
  { re: /^\[\[(.*)\]\]$/, shape: "subroutine" },
  { re: /^\[\((.*)\)\]$/, shape: "cylinder" },
  { re: /^\{\{(.*)\}\}$/, shape: "hexagon" },
  { re: /^\{(.*)\}$/, shape: "rhombus" },
  { re: /^\[\/(.*)\/\]$/, shape: "parallelogram" },
  { re: /^\[\/(.*)\\\]$/, shape: "trapezoid" },
  { re: /^\((.*)\)$/, shape: "rounded" },
  { re: /^\[(.*)\]$/, shape: "rectangle" },
];

function stripQuotes(s: string): string {
  const t = s.trim();
  if (t.startsWith('"') && t.endsWith('"')) {
    return t.slice(1, -1).replace(/&quot;/g, '"');
  }
  return t;
}

function parseShape(body: string): { label: string; shape: ShapeKind } {
  for (const { re, shape } of SHAPE_PATTERNS) {
    const m = body.match(re);
    if (m) return { label: stripQuotes(m[1]), shape };
  }
  return { label: stripQuotes(body), shape: "rectangle" };
}

/** Split "Kind: Label" decorated labels back into parts. */
function splitKind(label: string): { label: string; kind?: string } {
  const m = label.match(/^([A-Za-z][\w ]*?):\s+(.*)$/);
  if (m) return { kind: m[1], label: m[2] };
  return { label };
}

// Matches:  ID[shape body]  with the id being the leading token.
const NODE_DECL = /^([A-Za-z_][\w-]*)([\[\({].*[\]\)}])$/;

// Matches an edge:  A -->|label| B   /   A -.-> B   /   A ==> B
const EDGE_RE =
  /^([A-Za-z_][\w-]*)\s*(-->|---|-\.->|-\.-|==>|===)\s*(?:\|"?(.*?)"?\|)?\s*([A-Za-z_][\w-]*)/;

const STYLE_RE = /^style\s+([A-Za-z_][\w-]*)\s+(.*)$/;

function edgeStyle(token: string): EdgeLineStyle {
  if (token.startsWith("-.")) return "dotted";
  if (token.startsWith("==")) return "thick";
  return "solid";
}

export interface ParseResult {
  direction: Direction;
  nodes: FlowNode[];
  edges: FlowEdge[];
  error?: string;
}

/**
 * Parse a Mermaid `flowchart` document back into canvas nodes + edges.
 * Nodes are laid out on a simple grid; positions are refined by the
 * layout pass in the store when the graph is loaded.
 */
export function parseMermaid(src: string): ParseResult {
  const lines = src
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("%%"));

  let direction: Direction = "TB";
  const nodeMap = new Map<string, ParsedNode>();
  const edges: FlowEdge[] = [];
  const colorMap = new Map<string, string>();

  const header = lines.shift() ?? "";
  const dirMatch = header.match(/^(?:flowchart|graph)\s+(TB|TD|BT|LR|RL)/i);
  if (dirMatch) {
    const d = dirMatch[1].toUpperCase();
    direction = (d === "TD" ? "TB" : d) as Direction;
  } else if (!/^(flowchart|graph)/i.test(header)) {
    return {
      direction,
      nodes: [],
      edges: [],
      error: "Not a flowchart diagram — visual editing supports flowchart graphs.",
    };
  }

  const ensure = (id: string): ParsedNode => {
    let n = nodeMap.get(id);
    if (!n) {
      n = { id, label: id, shape: "rectangle" };
      nodeMap.set(id, n);
    }
    return n;
  };

  for (const line of lines) {
    // style line
    const sm = line.match(STYLE_RE);
    if (sm) {
      const fillStroke = sm[2].match(/stroke:\s*(#[0-9a-fA-F]{3,6})/);
      if (fillStroke) colorMap.set(sm[1], fillStroke[1]);
      continue;
    }

    // edge
    const em = line.match(EDGE_RE);
    if (em) {
      ensure(em[1]);
      ensure(em[4]);
      edges.push({
        id: `e-${em[1]}-${em[4]}-${edges.length}`,
        source: em[1],
        target: em[4],
        data: {
          label: em[3] ? stripQuotes(em[3]) : undefined,
          style: edgeStyle(em[2]),
        },
      });
      // A node may carry its shape inline on either side, handled below.
    }

    // node declaration (possibly the source side of an edge with a shape)
    const decl = line.match(NODE_DECL);
    if (decl) {
      const { label, shape } = parseShape(decl[2]);
      const { label: lbl, kind } = splitKind(label);
      const n = ensure(decl[1]);
      n.label = lbl;
      n.shape = shape;
      n.kind = kind;
    }
  }

  // Apply parsed colors.
  for (const [id, color] of colorMap) {
    const n = nodeMap.get(id);
    if (n) n.color = color;
  }

  // Grid layout placeholder; the store applies a real layout afterwards.
  const cols = Math.max(1, Math.ceil(Math.sqrt(nodeMap.size)));
  const nodes: FlowNode[] = [...nodeMap.values()].map((n, i) => ({
    id: n.id,
    type: "shape",
    position: { x: (i % cols) * 240 + 60, y: Math.floor(i / cols) * 160 + 60 },
    data: {
      label: n.label,
      shape: n.shape,
      kind: n.kind,
      color: n.color,
    },
  }));

  return { direction, nodes, edges };
}
