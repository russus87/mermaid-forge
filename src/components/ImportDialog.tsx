import { useState } from "react";
import * as Icons from "lucide-react";

import { Modal } from "./Modal";
import { CodeEditor } from "./CodeEditor";
import { useStore } from "../store/useStore";
import { detectDiagramType } from "../mermaid/detect";

const PLACEHOLDER = `flowchart TB
    A([Start]) --> B{Decision}
    B -->|yes| C[Do work]
    B -->|no| D[Skip]`;

export function ImportDialog({ onClose }: { onClose: () => void }) {
  const importMermaid = useStore((s) => s.importMermaid);
  const [code, setCode] = useState("");

  const type = code.trim() ? detectDiagramType(code) : "";
  const willBeVisual = type === "flowchart";

  function doImport() {
    if (!code.trim()) return;
    importMermaid(code);
    onClose();
  }

  return (
    <Modal title="Import Mermaid" icon="ClipboardPaste" onClose={onClose} width={640}>
      <p className="mf-modal-lead">
        Paste any Mermaid diagram. Flowcharts open in the visual editor; other
        types open in the code editor with live preview.
      </p>
      <div className="mf-import-editor">
        <CodeEditor value={code} onChange={setCode} />
        {!code && <div className="mf-import-ph">{PLACEHOLDER}</div>}
      </div>
      <div className="mf-modal-actions">
        <span className="mf-import-detect">
          {type ? (
            <>
              <Icons.ScanLine size={14} /> Detected: <strong>{type}</strong>
              {willBeVisual ? " → visual editor" : " → code editor"}
            </>
          ) : (
            <>&nbsp;</>
          )}
        </span>
        <div className="mf-modal-buttons">
          <button className="mf-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="mf-btn-primary" onClick={doImport} disabled={!code.trim()}>
            <Icons.Download size={15} /> Import
          </button>
        </div>
      </div>
    </Modal>
  );
}
