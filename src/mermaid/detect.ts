/** Identify the Mermaid diagram type from its source header. */
export function detectDiagramType(code: string): string {
  const first =
    code
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l && !l.startsWith("%%")) ?? "";

  const head = first.toLowerCase();
  if (head.startsWith("flowchart") || head.startsWith("graph")) return "flowchart";
  if (head.startsWith("sequencediagram")) return "sequenceDiagram";
  if (head.startsWith("classdiagram")) return "classDiagram";
  if (head.startsWith("statediagram")) return "stateDiagram-v2";
  if (head.startsWith("erdiagram")) return "erDiagram";
  if (head.startsWith("gantt")) return "gantt";
  if (head.startsWith("pie")) return "pie";
  if (head.startsWith("journey")) return "journey";
  if (head.startsWith("mindmap")) return "mindmap";
  if (head.startsWith("timeline")) return "timeline";
  if (head.startsWith("gitgraph")) return "gitGraph";
  if (head.startsWith("quadrantchart")) return "quadrantChart";
  if (head.startsWith("requirementdiagram")) return "requirement";
  return "unknown";
}

export function isFlowchart(code: string): boolean {
  return detectDiagramType(code) === "flowchart";
}

export interface Snippet {
  label: string;
  insert: string;
}

/** Quick-insert snippets shown as buttons in the code editor toolbar. */
export const SNIPPETS: Record<string, Snippet[]> = {
  sequenceDiagram: [
    { label: "Participant", insert: "participant Name" },
    { label: "Actor", insert: "actor User" },
    { label: "Message", insert: "A->>B: message" },
    { label: "Reply", insert: "B-->>A: response" },
    { label: "Note", insert: "Note over A,B: note text" },
    { label: "Loop", insert: "loop every minute\n    A->>B: ping\nend" },
    { label: "Alt", insert: "alt success\n    A->>B: ok\nelse failure\n    A->>B: retry\nend" },
  ],
  classDiagram: [
    { label: "Class", insert: "class Name {\n    +Type field\n    +method()\n}" },
    { label: "Inheritance", insert: "Base <|-- Derived" },
    { label: "Composition", insert: "Whole *-- Part" },
    { label: "Association", insert: "A --> B : label" },
  ],
  "stateDiagram-v2": [
    { label: "State", insert: "StateName" },
    { label: "Transition", insert: "A --> B : event" },
    { label: "Start", insert: "[*] --> First" },
    { label: "End", insert: "Last --> [*]" },
    { label: "Composite", insert: "state Parent {\n    [*] --> Child\n}" },
  ],
  erDiagram: [
    { label: "Entity", insert: "ENTITY {\n    string name\n    int id\n}" },
    { label: "One-to-many", insert: "A ||--o{ B : has" },
    { label: "Many-to-many", insert: "A }o--o{ B : relates" },
  ],
  gantt: [
    { label: "Section", insert: "section Name" },
    { label: "Task", insert: "Task name :id1, 2026-01-01, 5d" },
    { label: "Milestone", insert: "Milestone :milestone, after id1, 0d" },
  ],
};
