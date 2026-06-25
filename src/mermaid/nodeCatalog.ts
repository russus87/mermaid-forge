import type { ShapeKind } from "../types";

export interface PaletteItem {
  /** Stable key used to identify the item when dropped on the canvas. */
  id: string;
  label: string;
  shape: ShapeKind;
  /** Lucide icon name (resolved in the UI). */
  icon: string;
  /** Category chip text shown on the node. */
  kind?: string;
  /** Default accent color. */
  color: string;
  subtitle?: string;
}

export interface PaletteGroup {
  id: string;
  title: string;
  items: PaletteItem[];
}

/**
 * The palette is split into a generic "shapes" group (classic flowchart
 * building blocks) and an OpenShift / cloud-native group used to draw the
 * architecture of an OpenShift environment — the core "archmind" use case.
 */
export const PALETTE: PaletteGroup[] = [
  {
    id: "shapes",
    title: "Shapes",
    items: [
      { id: "process", label: "Process", shape: "rounded", icon: "Square", color: "#6366f1" },
      { id: "decision", label: "Decision", shape: "rhombus", icon: "Diamond", color: "#f59e0b" },
      { id: "start-end", label: "Start / End", shape: "stadium", icon: "CircleDot", color: "#10b981" },
      { id: "data", label: "Data", shape: "parallelogram", icon: "Database", color: "#0ea5e9" },
      { id: "storage", label: "Storage", shape: "cylinder", icon: "HardDrive", color: "#8b5cf6" },
      { id: "subprocess", label: "Subprocess", shape: "subroutine", icon: "Boxes", color: "#ec4899" },
      { id: "node-circle", label: "Connector", shape: "circle", icon: "Circle", color: "#64748b" },
      { id: "prep", label: "Preparation", shape: "hexagon", icon: "Hexagon", color: "#14b8a6" },
    ],
  },
  {
    id: "openshift",
    title: "OpenShift / Cloud",
    items: [
      { id: "os-cluster", label: "Cluster", shape: "hexagon", icon: "CircleDashed", kind: "Cluster", color: "#ee0000", subtitle: "OpenShift" },
      { id: "os-project", label: "Project", shape: "rounded", icon: "FolderTree", kind: "Namespace", color: "#cc0000" },
      { id: "os-node", label: "Worker Node", shape: "rectangle", icon: "Server", kind: "Node", color: "#7d7d7d" },
      { id: "os-master", label: "Control Plane", shape: "rectangle", icon: "ServerCog", kind: "Master", color: "#3c3c3c" },
      { id: "os-pod", label: "Pod", shape: "rounded", icon: "Box", kind: "Pod", color: "#326ce5" },
      { id: "os-deployment", label: "Deployment", shape: "subroutine", icon: "Layers", kind: "Deployment", color: "#2563eb" },
      { id: "os-service", label: "Service", shape: "rounded", icon: "Network", kind: "Service", color: "#0891b2" },
      { id: "os-route", label: "Route", shape: "stadium", icon: "Globe", kind: "Route", color: "#16a34a" },
      { id: "os-ingress", label: "Ingress", shape: "stadium", icon: "DoorOpen", kind: "Ingress", color: "#22c55e" },
      { id: "os-configmap", label: "ConfigMap", shape: "rectangle", icon: "FileCog", kind: "Config", color: "#a855f7" },
      { id: "os-secret", label: "Secret", shape: "rectangle", icon: "KeyRound", kind: "Secret", color: "#9333ea" },
      { id: "os-pvc", label: "PVC", shape: "cylinder", icon: "HardDrive", kind: "Storage", color: "#8b5cf6" },
      { id: "os-route-ext", label: "External LB", shape: "stadium", icon: "Cloud", kind: "LoadBalancer", color: "#0284c7" },
      { id: "os-registry", label: "Registry", shape: "cylinder", icon: "Container", kind: "Registry", color: "#475569" },
      { id: "os-operator", label: "Operator", shape: "hexagon", icon: "Cog", kind: "Operator", color: "#db2777" },
      { id: "os-db", label: "Database", shape: "cylinder", icon: "Database", kind: "StatefulSet", color: "#0d9488" },
    ],
  },
];

/** Flat lookup map keyed by palette item id. */
export const PALETTE_INDEX: Record<string, PaletteItem> = Object.fromEntries(
  PALETTE.flatMap((g) => g.items).map((i) => [i.id, i]),
);
