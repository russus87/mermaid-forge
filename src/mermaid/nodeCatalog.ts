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
  /** When true, dropping this item creates a container (subgraph) node. */
  group?: boolean;
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
    id: "containers",
    title: "Containers",
    items: [
      { id: "group-ns", label: "Namespace", shape: "rectangle", icon: "FolderTree", kind: "Namespace", color: "#cc0000", group: true },
      { id: "group-zone", label: "Zone / Boundary", shape: "rectangle", icon: "SquareDashedBottom", kind: "Zone", color: "#6366f1", group: true },
      { id: "group-cluster", label: "Cluster", shape: "rectangle", icon: "CircleDashed", kind: "Cluster", color: "#0891b2", group: true },
    ],
  },
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
  {
    id: "kubernetes",
    title: "Kubernetes",
    items: [
      { id: "k8s-deploy", label: "Deployment", shape: "subroutine", icon: "Layers", kind: "Deployment", color: "#326ce5" },
      { id: "k8s-sts", label: "StatefulSet", shape: "subroutine", icon: "Layers3", kind: "StatefulSet", color: "#326ce5" },
      { id: "k8s-ds", label: "DaemonSet", shape: "subroutine", icon: "LayoutGrid", kind: "DaemonSet", color: "#326ce5" },
      { id: "k8s-pod", label: "Pod", shape: "rounded", icon: "Box", kind: "Pod", color: "#2563eb" },
      { id: "k8s-svc", label: "Service", shape: "rounded", icon: "Network", kind: "Service", color: "#0891b2" },
      { id: "k8s-ing", label: "Ingress", shape: "stadium", icon: "DoorOpen", kind: "Ingress", color: "#22c55e" },
      { id: "k8s-job", label: "Job", shape: "rectangle", icon: "SquareCheck", kind: "Job", color: "#7c3aed" },
      { id: "k8s-cron", label: "CronJob", shape: "rectangle", icon: "Clock", kind: "CronJob", color: "#7c3aed" },
      { id: "k8s-hpa", label: "HPA", shape: "hexagon", icon: "Gauge", kind: "Autoscaler", color: "#16a34a" },
    ],
  },
  {
    id: "aws",
    title: "AWS",
    items: [
      { id: "aws-ec2", label: "EC2", shape: "rectangle", icon: "Server", kind: "Compute", color: "#ff9900" },
      { id: "aws-lambda", label: "Lambda", shape: "hexagon", icon: "Zap", kind: "Serverless", color: "#ff9900" },
      { id: "aws-s3", label: "S3 Bucket", shape: "cylinder", icon: "Archive", kind: "Storage", color: "#3f8624" },
      { id: "aws-rds", label: "RDS", shape: "cylinder", icon: "Database", kind: "Database", color: "#3b48cc" },
      { id: "aws-elb", label: "Load Balancer", shape: "stadium", icon: "Scale", kind: "ELB", color: "#8c4fff" },
      { id: "aws-apigw", label: "API Gateway", shape: "rounded", icon: "Webhook", kind: "API", color: "#ff4f8b" },
      { id: "aws-sqs", label: "SQS", shape: "parallelogram", icon: "ListEnd", kind: "Queue", color: "#ff4f8b" },
      { id: "aws-vpc", label: "VPC", shape: "rectangle", icon: "Cloud", kind: "Network", color: "#8c4fff" },
    ],
  },
  {
    id: "azure",
    title: "Azure",
    items: [
      { id: "az-vm", label: "Virtual Machine", shape: "rectangle", icon: "Server", kind: "Compute", color: "#0078d4" },
      { id: "az-func", label: "Functions", shape: "hexagon", icon: "Zap", kind: "Serverless", color: "#0078d4" },
      { id: "az-blob", label: "Blob Storage", shape: "cylinder", icon: "Archive", kind: "Storage", color: "#50e6ff" },
      { id: "az-sql", label: "Azure SQL", shape: "cylinder", icon: "Database", kind: "Database", color: "#0062ad" },
      { id: "az-aks", label: "AKS", shape: "subroutine", icon: "Layers", kind: "Kubernetes", color: "#0078d4" },
      { id: "az-lb", label: "Load Balancer", shape: "stadium", icon: "Scale", kind: "Network", color: "#50e6ff" },
    ],
  },
  {
    id: "gcp",
    title: "Google Cloud",
    items: [
      { id: "gcp-gce", label: "Compute Engine", shape: "rectangle", icon: "Server", kind: "Compute", color: "#4285f4" },
      { id: "gcp-run", label: "Cloud Run", shape: "rounded", icon: "Rocket", kind: "Serverless", color: "#4285f4" },
      { id: "gcp-gcs", label: "Cloud Storage", shape: "cylinder", icon: "Archive", kind: "Storage", color: "#34a853" },
      { id: "gcp-sql", label: "Cloud SQL", shape: "cylinder", icon: "Database", kind: "Database", color: "#ea4335" },
      { id: "gcp-gke", label: "GKE", shape: "subroutine", icon: "Layers", kind: "Kubernetes", color: "#4285f4" },
      { id: "gcp-lb", label: "Load Balancer", shape: "stadium", icon: "Scale", kind: "Network", color: "#fbbc04" },
    ],
  },
];

/** Flat lookup map keyed by palette item id. */
export const PALETTE_INDEX: Record<string, PaletteItem> = Object.fromEntries(
  PALETTE.flatMap((g) => g.items).map((i) => [i.id, i]),
);
