import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import * as Icons from "lucide-react";

let counter = 0;

interface Props {
  code: string;
  theme: "dark" | "light";
}

/** Renders Mermaid source to SVG, with graceful error reporting. */
export function MermaidView({ code, theme }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

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
    const id = `mf-view-${counter++}`;
    if (!code.trim()) {
      if (hostRef.current) hostRef.current.innerHTML = "";
      setError(null);
      return;
    }
    (async () => {
      try {
        const { svg } = await mermaid.render(id, code);
        if (!cancelled && hostRef.current) {
          hostRef.current.innerHTML = svg;
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, theme]);

  return (
    <div className="mf-mermaid-view">
      {error ? (
        <div className="mf-preview-error">
          <Icons.AlertTriangle size={16} /> {error}
        </div>
      ) : (
        <div className="mf-preview-host" ref={hostRef} />
      )}
    </div>
  );
}
