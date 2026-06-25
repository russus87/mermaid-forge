import { useEffect, useState } from "react";
import * as Icons from "lucide-react";

import { Inspector } from "./Inspector";
import { CodePanel } from "./CodePanel";
import { PreviewPanel } from "./PreviewPanel";
import { useStore } from "../store/useStore";

type Tab = "properties" | "code" | "preview";

const TABS: { id: Tab; label: string; icon: keyof typeof Icons }[] = [
  { id: "properties", label: "Properties", icon: "SlidersHorizontal" },
  { id: "code", label: "Code", icon: "Code2" },
  { id: "preview", label: "Preview", icon: "Eye" },
];

export function RightPanel() {
  const [tab, setTab] = useState<Tab>("properties");
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const selectedEdgeId = useStore((s) => s.selectedEdgeId);

  // Jump to the Properties tab whenever a new element is selected.
  useEffect(() => {
    if (selectedNodeId || selectedEdgeId) setTab("properties");
  }, [selectedNodeId, selectedEdgeId]);

  return (
    <aside className="mf-right">
      <nav className="mf-tabs">
        {TABS.map((t) => {
          const I = Icons[t.icon] as Icons.LucideIcon;
          return (
            <button
              key={t.id}
              className={tab === t.id ? "active" : ""}
              onClick={() => setTab(t.id)}
            >
              <I size={15} /> {t.label}
            </button>
          );
        })}
      </nav>
      <div className="mf-right-body">
        {tab === "properties" && <Inspector />}
        {tab === "code" && <CodePanel />}
        {tab === "preview" && <PreviewPanel />}
      </div>
    </aside>
  );
}
