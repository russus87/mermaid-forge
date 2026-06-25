import type {
  ArrowDir,
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
  group?: boolean;
  parentId?: string;
}

const SHAPE_PATTERNS: { re: RegExp; shape: ShapeKind }[] = [
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
  if (t.startsWith('"') && t.endsWith('"')) return t.slice(1, -1).replace(/&quot;/g, '"');
  return t;
}

function parseShape(body: string): { label: string; shape: ShapeKind } {
  for (const { re, shape } of SHAPE_PATTERNS) {
    const m = body.match(re);
    if (m) return { label: stripQuotes(m[1]), shape };
  }
  return { label: stripQuotes(body), shape: "rectangle" };
}

function splitKind(label: string): { label: string; kind?: string } {
  const m = label.match(/^([A-Za-z][\w ]*?):\s+(.*)$/);
  if (m) return { kind: m[1], label: m[2] };
  return { label };
}

const NODE_DECL = /^([A-Za-z_][\w-]*)([\[\({].*[\]\)}])$/;
const EDGE_RE =
  /^([A-Za-z_][\w-]*)\s*([-.=<>o]{2,})\s*(?:\|"?(.*?)"?\|)?\s*([A-Za-z_][\w-]*)/;
const STYLE_RE = /^style\s+([A-Za-z_][\w-]*)\s+(.*)$/;
const SUBGRAPH_RE = /^subgraph\s+([A-Za-z_][\w-]*)?\s*(?:\["?(.*?)"?\]|"?([^[\]]*?)"?)?\s*$/;

function edgeStyle(token: string): EdgeLineStyle {
  if (token.includes(".")) return "dotted";
  if (token.includes("=")) return "thick";
  return "solid";
}

function edgeArrow(token: string): ArrowDir {
  const left = token.startsWith("<") || token.startsWith("x") || token.startsWith("o");
  const right = token.endsWith(">") || token.endsWith("x") || token.endsWith("o");
  if (left && right) return "both";
  if (left) return "start";
  if (right) return "end";
  return "none";
}

export interface ParseResult {
  direction: Direction;
  nodes: FlowNode[];
  edges: FlowEdge[];
  error?: string;
}

export function parseMermaid(src: string): ParseResult {
  const lines = src
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("%%"));

  let direction: Direction = "TB";
  const nodeMap = new Map<string, ParsedNode>();
  const edges: FlowEdge[] = [];
  const colorMap = new Map<string, string>();
  const groupStack: string[] = [];
  let autoGroup = 0;

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
      n = { id, label: id, shape: "rectangle", parentId: groupStack[groupStack.length - 1] };
      nodeMap.set(id, n);
    } else if (!n.parentId && groupStack.length) {
      n.parentId = groupStack[groupStack.length - 1];
    }
    return n;
  };

  for (const line of lines) {
    if (/^end$/i.test(line)) {
      groupStack.pop();
      continue;
    }

    const sg = line.match(SUBGRAPH_RE);
    if (line.toLowerCase().startsWith("subgraph") && sg) {
      const id = sg[1] || `group_${autoGroup++}`;
      const label = stripQuotes(sg[2] ?? sg[3] ?? id);
      const { label: lbl, kind } = splitKind(label);
      const g = ensure(id);
      g.group = true;
      g.label = lbl;
      g.kind = kind;
      g.shape = "rectangle";
      groupStack.push(id);
      continue;
    }

    const sm = line.match(STYLE_RE);
    if (sm) {
      const stroke = sm[2].match(/stroke:\s*(#[0-9a-fA-F]{3,6})/);
      if (stroke) colorMap.set(sm[1], stroke[1]);
      continue;
    }

    const em = line.match(EDGE_RE);
    if (em && !line.toLowerCase().startsWith("subgraph")) {
      ensure(em[1]);
      ensure(em[4]);
      edges.push({
        id: `e-${em[1]}-${em[4]}-${edges.length}`,
        source: em[1],
        target: em[4],
        data: {
          label: em[3] ? stripQuotes(em[3]) : undefined,
          style: edgeStyle(em[2]),
          arrow: edgeArrow(em[2]),
        },
      });
    }

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

  for (const [id, color] of colorMap) {
    const n = nodeMap.get(id);
    if (n) n.color = color;
  }

  const parsed = [...nodeMap.values()];
  const cols = Math.max(1, Math.ceil(Math.sqrt(parsed.length)));
  const nodes: FlowNode[] = parsed.map((n, i) => ({
    id: n.id,
    type: n.group ? "group" : "shape",
    position: { x: (i % cols) * 240 + 60, y: Math.floor(i / cols) * 160 + 60 },
    parentId: n.parentId,
    extent: n.parentId ? "parent" : undefined,
    data: {
      label: n.label,
      shape: n.shape,
      kind: n.kind,
      color: n.color,
      group: n.group,
    },
  }));

  return { direction, nodes, edges };
}
