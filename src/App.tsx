import { useEffect, useRef, useState } from "react";

import { Toolbar } from "./components/Toolbar";
import { Palette } from "./components/Palette";
import { Canvas } from "./components/Canvas";
import { RightPanel } from "./components/RightPanel";
import { CodeMode } from "./components/CodeMode";
import { TemplateGallery } from "./components/TemplateGallery";
import { ImportDialog } from "./components/ImportDialog";
import { useStore } from "./store/useStore";

const STORAGE_KEY = "mermaid-forge:session:v1";

export default function App() {
  const theme = useStore((s) => s.theme);
  const mode = useStore((s) => s.mode);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const hydrated = useRef(false);

  // Restore last session once on startup.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) useStore.getState().hydrate(JSON.parse(raw));
    } catch {
      /* ignore corrupt session */
    }
    hydrated.current = true;
  }, []);

  // Persist on change (debounced).
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const unsub = useStore.subscribe((s) => {
      if (!hydrated.current) return;
      clearTimeout(t);
      const persist = s.getPersisted;
      t = setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(persist()));
        } catch {
          /* storage full / unavailable */
        }
      }, 400);
    });
    return () => {
      clearTimeout(t);
      unsub();
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      const mod = e.ctrlKey || e.metaKey;
      const st = useStore.getState();

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) st.redo();
        else st.undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        st.redo();
        return;
      }

      // Graph clipboard shortcuts only apply on the visual canvas.
      if (st.mode === "visual" && !typing) {
        if (mod && e.key.toLowerCase() === "c") { e.preventDefault(); st.copySelection(); return; }
        if (mod && e.key.toLowerCase() === "x") { e.preventDefault(); st.cutSelection(); return; }
        if (mod && e.key.toLowerCase() === "v") { e.preventDefault(); st.paste(); return; }
        if (mod && e.key.toLowerCase() === "d") { e.preventDefault(); st.duplicateSelection(); return; }
        if (mod && e.key.toLowerCase() === "a") { e.preventDefault(); st.selectAll(); return; }
        if (mod && e.key.toLowerCase() === "g") {
          e.preventDefault();
          if (e.shiftKey) st.ungroupSelected();
          else st.groupSelected();
          return;
        }
        if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); st.deleteSelected(); }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="mf-app">
      <Toolbar onOpenTemplates={() => setTemplatesOpen(true)} onOpenImport={() => setImportOpen(true)} />
      {mode === "visual" ? (
        <div className="mf-workspace">
          <Palette />
          <Canvas />
          <RightPanel />
        </div>
      ) : (
        <div className="mf-workspace-code">
          <CodeMode />
        </div>
      )}

      {templatesOpen && <TemplateGallery onClose={() => setTemplatesOpen(false)} />}
      {importOpen && <ImportDialog onClose={() => setImportOpen(false)} />}
    </div>
  );
}
