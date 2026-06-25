import { useEffect, useState } from "react";
import * as Icons from "lucide-react";

import { useStore } from "../store/useStore";
import { generateMermaid } from "../mermaid/generate";
import { CodeEditor } from "./CodeEditor";

export function CodePanel() {
  const direction = useStore((s) => s.direction);
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const applyCode = useStore((s) => s.applyCode);

  const liveCode = generateMermaid(direction, nodes, edges);

  // `draft` is non-null only while the user is editing the code by hand.
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // When the canvas changes and we are not mid-edit, follow the live code.
  useEffect(() => {
    if (draft === null) setError(null);
  }, [liveCode, draft]);

  const value = draft ?? liveCode;
  const editing = draft !== null;

  function apply() {
    if (draft === null) return;
    const res = applyCode(draft);
    if (res.ok) {
      setDraft(null);
      setError(null);
    } else {
      setError(res.error ?? "Could not parse the diagram.");
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="mf-codepanel">
      <div className="mf-codepanel-bar">
        <span className="mf-codepanel-title">
          <Icons.Code2 size={14} /> Mermaid source
          {editing && <em className="mf-badge-edit">editing</em>}
        </span>
        <div className="mf-codepanel-actions">
          <button onClick={copy} title="Copy to clipboard">
            {copied ? <Icons.Check size={14} /> : <Icons.Copy size={14} />}
          </button>
          {editing && (
            <>
              <button onClick={() => { setDraft(null); setError(null); }} title="Discard edits">
                <Icons.Undo2 size={14} />
              </button>
              <button className="mf-apply" onClick={apply} title="Apply to canvas (Ctrl+Enter)">
                <Icons.CornerDownLeft size={14} /> Apply
              </button>
            </>
          )}
        </div>
      </div>

      <div
        className="mf-codepanel-body"
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") apply();
        }}
      >
        <CodeEditor value={value} onChange={(v) => setDraft(v)} />
      </div>

      {error && (
        <div className="mf-code-error">
          <Icons.AlertTriangle size={14} /> {error}
        </div>
      )}
      <div className="mf-codepanel-hint">
        Edit the source and press <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to rebuild the canvas.
      </div>
    </div>
  );
}
