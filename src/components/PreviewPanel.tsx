import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import * as Icons from "lucide-react";

import { useStore } from "../store/useStore";
import { generateMermaid } from "../mermaid/generate";

let counter = 0;

export function PreviewPanel() {
  const direction = useStore((s) => s.direction);
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const theme = useStore((s) => s.theme);

  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  const code = generateMermaid(direction, nodes, edges);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === "dark" ? "dark" : "default",
      securityLevel: "loose",
      flowchart: { curve: "basis", htmlLabels: true },
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    });
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    const id = `mf-preview-${counter++}`;
    (async () => {
      try {
        const { svg } = await mermaid.render(id, code);
        if (!cancelled && hostRef.current) {
          hostRef.current.innerHTML = svg;
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, theme]);

  return (
    <div className="mf-preview">
      <div className="mf-preview-bar">
        <span><Icons.Eye size={14} /> Live preview</span>
      </div>
      <div className="mf-preview-scroll">
        {error ? (
          <div className="mf-preview-error">
            <Icons.AlertTriangle size={16} /> {error}
          </div>
        ) : (
          <div className="mf-preview-host" ref={hostRef} />
        )}
      </div>
    </div>
  );
}
