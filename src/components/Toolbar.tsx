import { useState } from "react";
import * as Icons from "lucide-react";

import { useStore } from "../store/useStore";
import type { Direction } from "../types";
import { openTextFile, readFileByPath, saveFile } from "../services/files";
import { copyPngToClipboard, renderSvg, svgToPdf, svgToPng } from "../services/export";
import { getRecent, pushRecent, type RecentFile } from "../services/recent";

interface Props {
  onOpenTemplates: () => void;
  onOpenImport: () => void;
}

const DIRECTIONS: { value: Direction; icon: keyof typeof Icons; title: string }[] = [
  { value: "TB", icon: "ArrowDown", title: "Top to bottom" },
  { value: "LR", icon: "ArrowRight", title: "Left to right" },
  { value: "BT", icon: "ArrowUp", title: "Bottom to top" },
  { value: "RL", icon: "ArrowLeft", title: "Right to left" },
];

const PROJECT_FILTER = [{ name: "Mermaid Forge", extensions: ["forge.json", "json"] }];

export function Toolbar({ onOpenTemplates, onOpenImport }: Props) {
  const mode = useStore((s) => s.mode);
  const direction = useStore((s) => s.direction);
  const setDirection = useStore((s) => s.setDirection);
  const relayout = useStore((s) => s.relayout);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const dirty = useStore((s) => s.dirty);
  const filePath = useStore((s) => s.filePath);

  const [busy, setBusy] = useState<string | null>(null);
  const [recentOpen, setRecentOpen] = useState(false);
  const [recent, setRecent] = useState<RecentFile[]>([]);
  const [copied, setCopied] = useState(false);

  function loadProjectContents(contents: string, path: string | null) {
    const data = JSON.parse(contents);
    const st = useStore.getState();
    if (data.version === 1 && data.snapshot) st.hydrate(data);
    else st.loadSnapshot({ direction: data.direction ?? "TB", nodes: data.nodes ?? [], edges: data.edges ?? [] });
    st.setFilePath(path);
    st.markSaved();
    if (path) pushRecent(path);
  }

  async function saveProject() {
    const payload = JSON.stringify(useStore.getState().getPersisted(), null, 2);
    const path = await saveFile({ defaultName: fileBase() + ".forge.json", filters: PROJECT_FILTER, contents: payload });
    if (path) {
      useStore.getState().setFilePath(path);
      useStore.getState().markSaved();
      pushRecent(path);
    }
  }

  async function openProject() {
    const res = await openTextFile(PROJECT_FILTER);
    if (!res) return;
    try {
      loadProjectContents(res.contents, res.path);
    } catch {
      alert("That file is not a valid Mermaid Forge project.");
    }
  }

  async function openByPath(path: string) {
    setRecentOpen(false);
    const contents = await readFileByPath(path);
    if (contents == null) {
      alert("Could not open that file — it may have moved.");
      return;
    }
    try {
      loadProjectContents(contents, path);
    } catch {
      alert("That file is not a valid Mermaid Forge project.");
    }
  }

  async function exportMermaid() {
    await saveFile({
      defaultName: fileBase() + ".mmd",
      filters: [{ name: "Mermaid", extensions: ["mmd"] }],
      contents: useStore.getState().currentCode(),
    });
  }

  async function exportImage(kind: "svg" | "png" | "pdf") {
    setBusy(kind);
    try {
      const st = useStore.getState();
      const svg = await renderSvg(st.currentCode(), st.theme);
      if (kind === "svg") {
        await saveFile({ defaultName: fileBase() + ".svg", filters: [{ name: "SVG image", extensions: ["svg"] }], contents: svg });
      } else if (kind === "png") {
        await saveFile({ defaultName: fileBase() + ".png", filters: [{ name: "PNG image", extensions: ["png"] }], contents: await svgToPng(svg, 2.5) });
      } else {
        await saveFile({ defaultName: fileBase() + ".pdf", filters: [{ name: "PDF document", extensions: ["pdf"] }], contents: await svgToPdf(svg, 2.5) });
      }
    } catch (e) {
      alert(`Export failed: ${e instanceof Error ? e.message : e}`);
    } finally {
      setBusy(null);
    }
  }

  async function copyPng() {
    setBusy("copy");
    try {
      const st = useStore.getState();
      const svg = await renderSvg(st.currentCode(), st.theme);
      await copyPngToClipboard(svg, 2.5);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch (e) {
      alert(`Copy failed: ${e instanceof Error ? e.message : e}`);
    } finally {
      setBusy(null);
    }
  }

  function fileBase(): string {
    if (!filePath) return "diagram";
    const name = filePath.split(/[\\/]/).pop() ?? "diagram";
    return name.replace(/\.(forge\.json|json|mmd|svg|png|pdf)$/i, "");
  }

  return (
    <header className="mf-toolbar">
      <div className="mf-brand">
        <span className="mf-logo"><Icons.Workflow size={18} /></span>
        <div className="mf-brand-text">
          <strong>Mermaid Forge</strong>
          <span className="mf-brand-file">{fileBase()}{dirty ? " •" : ""}</span>
        </div>
      </div>

      <div className="mf-toolbar-group">
        <button className="mf-tbtn" onClick={onOpenTemplates} title="New from template">
          <Icons.FilePlus2 size={16} />
        </button>
        <button className="mf-tbtn" onClick={openProject} title="Open project">
          <Icons.FolderOpen size={16} />
        </button>
        <div className="mf-dropdown">
          <button
            className="mf-tbtn"
            title="Recent files"
            onClick={() => { setRecent(getRecent()); setRecentOpen((o) => !o); }}
          >
            <Icons.History size={16} />
          </button>
          {recentOpen && (
            <>
              <div className="mf-dropdown-backdrop" onClick={() => setRecentOpen(false)} />
              <div className="mf-dropdown-menu">
                {recent.length === 0 ? (
                  <div className="mf-dropdown-empty">No recent files</div>
                ) : (
                  recent.map((r) => (
                    <button key={r.path} className="mf-dropdown-item" onClick={() => openByPath(r.path)} title={r.path}>
                      <Icons.FileJson size={14} />
                      <span>{r.name}</span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
        <button className="mf-tbtn" onClick={saveProject} title="Save project">
          <Icons.Save size={16} />
        </button>
        <button className="mf-tbtn" onClick={onOpenImport} title="Import Mermaid code">
          <Icons.ClipboardPaste size={16} />
        </button>
      </div>

      <div className="mf-toolbar-group">
        <button className="mf-tbtn" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          <Icons.Undo2 size={16} />
        </button>
        <button className="mf-tbtn" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
          <Icons.Redo2 size={16} />
        </button>
      </div>

      {mode === "visual" && (
        <>
          <div className="mf-toolbar-group mf-dir">
            {DIRECTIONS.map((d) => {
              const I = Icons[d.icon] as Icons.LucideIcon;
              return (
                <button
                  key={d.value}
                  className={`mf-tbtn ${direction === d.value ? "active" : ""}`}
                  onClick={() => setDirection(d.value)}
                  title={d.title}
                >
                  <I size={16} />
                </button>
              );
            })}
          </div>
          <div className="mf-toolbar-group">
            <button className="mf-tbtn-wide" onClick={relayout} title="Auto-arrange the graph">
              <Icons.Wand2 size={15} /> Arrange
            </button>
          </div>
        </>
      )}

      <div className="mf-toolbar-spacer" />

      {mode === "code" && <span className="mf-mode-badge"><Icons.Code2 size={13} /> Code mode</span>}

      <div className="mf-toolbar-group">
        <button className="mf-tbtn" onClick={copyPng} disabled={busy === "copy"} title="Copy PNG to clipboard">
          {copied ? <Icons.Check size={16} /> : <Icons.Clipboard size={16} />}
        </button>
        <button className="mf-tbtn-wide" onClick={exportMermaid} title="Export .mmd">
          <Icons.FileCode2 size={15} /> .mmd
        </button>
        <button className="mf-tbtn-wide" onClick={() => exportImage("svg")} disabled={busy === "svg"}>
          <Icons.Image size={15} /> SVG
        </button>
        <button className="mf-tbtn-wide" onClick={() => exportImage("png")} disabled={busy === "png"}>
          {busy === "png" ? <Icons.Loader2 size={15} className="mf-spin" /> : <Icons.ImageDown size={15} />} PNG
        </button>
        <button className="mf-tbtn-wide" onClick={() => exportImage("pdf")} disabled={busy === "pdf"}>
          {busy === "pdf" ? <Icons.Loader2 size={15} className="mf-spin" /> : <Icons.FileText size={15} />} PDF
        </button>
      </div>

      <button className="mf-tbtn" onClick={toggleTheme} title="Toggle theme">
        {theme === "dark" ? <Icons.Sun size={16} /> : <Icons.Moon size={16} />}
      </button>
    </header>
  );
}
