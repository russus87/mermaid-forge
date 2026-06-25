import * as Icons from "lucide-react";

import { useStore } from "../store/useStore";
import { CodeEditor } from "./CodeEditor";
import { MermaidView } from "./MermaidView";
import { SNIPPETS } from "../mermaid/detect";

export function CodeMode() {
  const rawCode = useStore((s) => s.rawCode);
  const setRawCode = useStore((s) => s.setRawCode);
  const codeDiagramType = useStore((s) => s.codeDiagramType);
  const theme = useStore((s) => s.theme);
  const applyCode = useStore((s) => s.applyCode);
  const setMode = useStore((s) => s.setMode);

  const snippets = SNIPPETS[codeDiagramType] ?? [];
  const canEditVisually = codeDiagramType === "flowchart";

  function insert(text: string) {
    const trimmed = rawCode.replace(/\s+$/, "");
    setRawCode(`${trimmed}\n    ${text}\n`);
  }

  return (
    <div className="mf-codemode">
      <div className="mf-codemode-pane mf-codemode-left">
        <div className="mf-codemode-bar">
          <span className="mf-codemode-type">
            <Icons.Code2 size={14} /> {codeDiagramType}
          </span>
          <div className="mf-codemode-baractions">
            {canEditVisually ? (
              <button className="mf-btn-primary mf-btn-sm" onClick={() => applyCode(rawCode)}>
                <Icons.MousePointer2 size={14} /> Edit visually
              </button>
            ) : (
              <button className="mf-btn-ghost mf-btn-sm" onClick={() => setMode("visual")} title="Back to the visual canvas">
                <Icons.LayoutDashboard size={14} /> Visual canvas
              </button>
            )}
          </div>
        </div>

        {snippets.length > 0 && (
          <div className="mf-snippets">
            {snippets.map((s) => (
              <button key={s.label} className="mf-snippet" onClick={() => insert(s.insert)} title={`Insert ${s.label}`}>
                <Icons.Plus size={12} /> {s.label}
              </button>
            ))}
          </div>
        )}

        <div className="mf-codemode-editor">
          <CodeEditor value={rawCode} onChange={setRawCode} />
        </div>
      </div>

      <div className="mf-codemode-pane mf-codemode-right">
        <div className="mf-codemode-bar">
          <span className="mf-codemode-type"><Icons.Eye size={14} /> Live preview</span>
        </div>
        <div className="mf-codemode-preview">
          <MermaidView code={rawCode} theme={theme} />
        </div>
      </div>
    </div>
  );
}
