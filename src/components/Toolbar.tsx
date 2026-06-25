import { useState } from "react";
import * as Icons from "lucide-react";

import { useStore } from "../store/useStore";
import type { Direction } from "../types";
import { generateMermaid } from "../mermaid/generate";
import { openTextFile, saveFile } from "../services/files";
import { renderSvg, svgToPng } from "../services/export";

const DIRECTIONS: { value: Direction; icon: keyof typeof Icons; title: string }[] = [
  { value: "TB", icon: "ArrowDown", title: "Top to bottom" },
  { value: "LR", icon: "ArrowRight", title: "Left to right" },
  { value: "BT", icon: "ArrowUp", title: "Bottom to top" },
  { value: "RL", icon: "ArrowLeft", title: "Right to left" },
];

const PROJECT_FILTER = [{ name: "Mermaid Forge", extensions: ["forge.json", "json"] }];

export function Toolbar() {
  const direction = useStore((s) => s.direction);
  const setDirection = useStore((s) => s.setDirection);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const newDiagram = useStore((s) => s.newDiagram);
  const dirty = useStore((s) => s.dirty);
  const filePath = useStore((s) => s.filePath);

  const [busy, setBusy] = useState<string | null>(null);

  async function saveProject() {
    const s = useStore.getState();
    const payload = JSON.stringify(
      { version: 1, direction: s.direction, nodes: s.nodes, edges: s.edges },
      null,
      2,
    );
    const path = await saveFile({
      defaultName: fileBase() + ".forge.json",
      filters: PROJECT_FILTER,
      contents: payload,
    });
    if (path) {
      useStore.getState().setFilePath(path);
      useStore.getState().markSaved();
    }
  }

  async function openProject() {
    const res = await openTextFile(PROJECT_FILTER);
    if (!res) return;
    try {
      const data = JSON.parse(res.contents);
      useStore.getState().loadSnapshot(
        { direction: data.direction ?? "TB", nodes: data.nodes ?? [], edges: data.edges ?? [] },
        res.path,
      );
    } catch {
      alert("That file is not a valid Mermaid Forge project.");
    }
  }

  async function exportMermaid() {
    const s = useStore.getState();
    await saveFile({
      defaultName: fileBase() + ".mmd",
      filters: [{ name: "Mermaid", extensions: ["mmd"] }],
      contents: generateMermaid(s.direction, s.nodes, s.edges),
    });
  }

  async function exportImage(kind: "svg" | "png") {
    const s = useStore.getState();
    setBusy(kind);
    try {
      const code = generateMermaid(s.direction, s.nodes, s.edges);
      const svg = await renderSvg(code, s.theme);
      if (kind === "svg") {
        await saveFile({
          defaultName: fileBase() + ".svg",
          filters: [{ name: "SVG image", extensions: ["svg"] }],
          contents: svg,
        });
      } else {
        const png = await svgToPng(svg, 2.5);
        await saveFile({
          defaultName: fileBase() + ".png",
          filters: [{ name: "PNG image", extensions: ["png"] }],
          contents: png,
        });
      }
    } catch (e) {
      alert(`Export failed: ${e instanceof Error ? e.message : e}`);
    } finally {
      setBusy(null);
    }
  }

  function fileBase(): string {
    if (!filePath) return "diagram";
    const name = filePath.split(/[\\/]/).pop() ?? "diagram";
    return name.replace(/\.(forge\.json|json|mmd|svg|png)$/i, "");
  }

  return (
    <header className="mf-toolbar">
      <div className="mf-brand">
        <span className="mf-logo"><Icons.Workflow size={18} /></span>
        <div className="mf-brand-text">
          <strong>Mermaid Forge</strong>
          <span className="mf-brand-file">
            {fileBase()}{dirty ? " •" : ""}
          </span>
        </div>
      </div>

      <div className="mf-toolbar-group">
        <button className="mf-tbtn" onClick={newDiagram} title="New diagram">
          <Icons.FilePlus2 size={16} />
        </button>
        <button className="mf-tbtn" onClick={openProject} title="Open project">
          <Icons.FolderOpen size={16} />
        </button>
        <button className="mf-tbtn" onClick={saveProject} title="Save project">
          <Icons.Save size={16} />
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

      <div className="mf-toolbar-spacer" />

      <div className="mf-toolbar-group">
        <button className="mf-tbtn-wide" onClick={exportMermaid} title="Export .mmd">
          <Icons.FileCode2 size={15} /> .mmd
        </button>
        <button className="mf-tbtn-wide" onClick={() => exportImage("svg")} disabled={busy === "svg"}>
          <Icons.Image size={15} /> SVG
        </button>
        <button className="mf-tbtn-wide" onClick={() => exportImage("png")} disabled={busy === "png"}>
          {busy === "png" ? <Icons.Loader2 size={15} className="mf-spin" /> : <Icons.ImageDown size={15} />} PNG
        </button>
      </div>

      <button className="mf-tbtn" onClick={toggleTheme} title="Toggle theme">
        {theme === "dark" ? <Icons.Sun size={16} /> : <Icons.Moon size={16} />}
      </button>
    </header>
  );
}
