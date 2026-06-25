import type { Direction, FlowEdge, FlowNode } from "../types";

export interface VisualTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  mode: "visual";
  direction: Direction;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  mode: "code";
  diagramType: string;
  code: string;
}

export type Template = VisualTemplate | CodeTemplate;

const n = (
  id: string,
  x: number,
  y: number,
  label: string,
  shape: FlowNode["data"]["shape"],
  color: string,
  kind?: string,
  icon?: string,
): FlowNode => ({
  id,
  type: "shape",
  position: { x, y },
  data: { label, shape, color, kind, icon },
});

const e = (
  id: string,
  source: string,
  target: string,
  style: "solid" | "dotted" | "thick" = "solid",
  label?: string,
): FlowEdge => ({
  id,
  source,
  target,
  data: { style, label },
});

export const TEMPLATES: Template[] = [
  {
    id: "blank",
    name: "Blank flowchart",
    description: "Start from an empty canvas.",
    icon: "Square",
    mode: "visual",
    direction: "TB",
    nodes: [],
    edges: [],
  },
  {
    id: "openshift-3tier",
    name: "OpenShift 3-tier app",
    description: "Route → Service → Deployment → Pods, the classic OpenShift topology.",
    icon: "Boxes",
    mode: "visual",
    direction: "TB",
    nodes: [
      n("route", 320, 20, "apps.example.com", "stadium", "#16a34a", "Route", "Globe"),
      n("svc", 320, 170, "frontend", "rounded", "#0891b2", "Service", "Network"),
      n("deploy", 320, 320, "frontend", "subroutine", "#2563eb", "Deployment", "Layers"),
      n("pod1", 120, 480, "frontend-7d4", "rounded", "#326ce5", "Pod", "Box"),
      n("pod2", 340, 480, "frontend-9b1", "rounded", "#326ce5", "Pod", "Box"),
      n("pod3", 560, 480, "frontend-k2x", "rounded", "#326ce5", "Pod", "Box"),
      n("cfg", 40, 320, "app-config", "rectangle", "#a855f7", "ConfigMap", "FileCog"),
      n("sec", 600, 320, "tls-secret", "rectangle", "#9333ea", "Secret", "KeyRound"),
    ],
    edges: [
      e("e1", "route", "svc"),
      e("e2", "svc", "deploy"),
      e("e3", "deploy", "pod1", "dotted"),
      e("e4", "deploy", "pod2", "dotted"),
      e("e5", "deploy", "pod3", "dotted"),
      e("e6", "cfg", "deploy", "dotted", "mounts"),
      e("e7", "sec", "deploy", "dotted", "mounts"),
    ],
  },
  {
    id: "cicd",
    name: "CI/CD pipeline",
    description: "A left-to-right build → test → deploy pipeline.",
    icon: "GitBranch",
    mode: "visual",
    direction: "LR",
    nodes: [
      n("src", 20, 120, "Git push", "stadium", "#10b981", "Trigger", "GitCommitVertical"),
      n("build", 240, 120, "Build image", "rounded", "#6366f1", "Stage", "Package"),
      n("test", 460, 120, "Run tests", "rounded", "#f59e0b", "Stage", "FlaskConical"),
      n("gate", 680, 120, "Approve?", "rhombus", "#f59e0b", undefined, "Diamond"),
      n("deploy", 900, 40, "Deploy prod", "rounded", "#ee0000", "Stage", "Rocket"),
      n("reject", 900, 220, "Notify team", "rounded", "#64748b", "Stage", "Bell"),
    ],
    edges: [
      e("e1", "src", "build"),
      e("e2", "build", "test"),
      e("e3", "test", "gate"),
      e("e4", "gate", "deploy", "solid", "yes"),
      e("e5", "gate", "reject", "dotted", "no"),
    ],
  },
  {
    id: "seq",
    name: "Sequence diagram",
    description: "Actors exchanging messages over time.",
    icon: "MessagesSquare",
    mode: "code",
    diagramType: "sequenceDiagram",
    code: `sequenceDiagram
    actor User
    participant API
    participant DB
    User->>API: POST /login
    API->>DB: SELECT user
    DB-->>API: user row
    API-->>User: 200 OK + token
    Note over User,API: session established`,
  },
  {
    id: "class",
    name: "Class diagram",
    description: "UML classes with attributes, methods and relationships.",
    icon: "Boxes",
    mode: "code",
    diagramType: "classDiagram",
    code: `classDiagram
    class Service {
      +String name
      +int replicas
      +scale(int n)
    }
    class Deployment {
      +String image
      +rollout()
    }
    class Pod {
      +String status
    }
    Deployment "1" --> "*" Pod : manages
    Service --> Deployment : selects`,
  },
  {
    id: "er",
    name: "Entity-Relationship",
    description: "Database entities and their relationships.",
    icon: "Database",
    mode: "code",
    diagramType: "erDiagram",
    code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    PRODUCT ||--o{ LINE_ITEM : "ordered in"
    CUSTOMER {
      string name
      string email
    }
    ORDER {
      int id
      datetime created
    }`,
  },
  {
    id: "state",
    name: "State machine",
    description: "States and transitions (stateDiagram-v2).",
    icon: "Workflow",
    mode: "code",
    diagramType: "stateDiagram-v2",
    code: `stateDiagram-v2
    [*] --> Pending
    Pending --> Running : scheduled
    Running --> Succeeded : exit 0
    Running --> Failed : exit != 0
    Failed --> Pending : retry
    Succeeded --> [*]`,
  },
  {
    id: "gantt",
    name: "Gantt chart",
    description: "Project timeline with tasks and milestones.",
    icon: "CalendarRange",
    mode: "code",
    diagramType: "gantt",
    code: `gantt
    title Release plan
    dateFormat YYYY-MM-DD
    section Build
    Scaffold app        :done,    a1, 2026-06-01, 5d
    Visual editor       :active,  a2, after a1, 8d
    section Ship
    Packaging & CI      :         a3, after a2, 4d
    Public release      :milestone, after a3, 0d`,
  },
];
