import * as Icons from "lucide-react";

import { useStore } from "../store/useStore";
import { generateMermaid } from "../mermaid/generate";
import { MermaidView } from "./MermaidView";

export function PreviewPanel() {
  const direction = useStore((s) => s.direction);
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const theme = useStore((s) => s.theme);

  const code = generateMermaid(direction, nodes, edges);

  return (
    <div className="mf-preview">
      <div className="mf-preview-bar">
        <span><Icons.Eye size={14} /> Live preview</span>
      </div>
      <div className="mf-preview-scroll">
        <MermaidView code={code} theme={theme} />
      </div>
    </div>
  );
}
