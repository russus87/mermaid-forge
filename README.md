<div align="center">

<img src="assets/logo.svg" width="120" alt="Mermaid Forge logo" />

# Mermaid Forge

**A beautiful, professional desktop editor for [Mermaid](https://mermaid.js.org) diagrams — with true drag-and-drop graph editing and a dedicated palette for OpenShift / cloud-native architecture.**

Built with Tauri 2 + React. Tiny native binaries, instant startup, fully offline.

[![CI](https://github.com/russus87/mermaid-forge/actions/workflows/ci.yml/badge.svg)](https://github.com/russus87/mermaid-forge/actions/workflows/ci.yml)
[![Release](https://github.com/russus87/mermaid-forge/actions/workflows/release.yml/badge.svg)](https://github.com/russus87/mermaid-forge/actions/workflows/release.yml)
![License](https://img.shields.io/badge/license-MIT-6366f1)

</div>

---

## ✨ Features

- **Drag-and-drop canvas** — drop components from the palette, connect them by dragging between handles, resize and re-style on the fly. Powered by [React Flow](https://reactflow.dev).
- **Bidirectional code ↔ canvas sync** — edit visually and watch the Mermaid source update live, or hand-edit the source and rebuild the canvas with `Ctrl+Enter`.
- **Container / subgraph nodes** — wrap resources in a **Namespace / Zone / Cluster** box (mapped to Mermaid `subgraph`); drag nodes in and out, children move with the container. The core of real architecture diagrams.
- **Cloud icon packs** — first-class palettes for **OpenShift, Kubernetes, AWS, Azure, and Google Cloud** (Pod, Service, Route, Lambda, S3, AKS, Cloud Run, …).
- **Classic flowchart shapes** — process, decision, stadium, cylinder, hexagon, subroutine, parallelogram, and others.
- **Editing that feels native** — multi-select (rubber-band), group move, **copy / cut / paste / duplicate**, **double-click to rename**, **drag a connection onto empty canvas to spawn a connected node**, smart **alignment guides** + an **align/distribute toolbar**, **subgraph-aware auto-arrange** (dagre), undo / redo.
- **Advanced edge editing** — solid / dotted / thick lines, **arrow direction** (→, ↔, ←, none), and curve style (smooth, bézier, straight, step).
- **Templates gallery** — start from OpenShift 3-tier, CI/CD pipeline, sequence, class, ER, state machine, Gantt, and more.
- **Import** any Mermaid source — flowcharts open in the visual editor, everything else in the code editor.
- **Live Mermaid preview** — render the real Mermaid output side-by-side.
- **Session restore** + **recent files** — pick up exactly where you left off.
- **Polished, professional UI** — refined dark & light themes, glassy panels, a minimap, snapping grid, and accent-colored nodes.
- **Export** — `.mmd` source, **SVG**, high-resolution **PNG**, **PDF**, and **copy PNG to clipboard**. Save/open native `.forge.json` projects.

## 🖼️ Diagram types

Mermaid Forge has two complementary surfaces:

- **Visual mode** — a full drag-and-drop canvas for **graph-shaped** diagrams (flowcharts and OpenShift / cloud architecture).
- **Code mode** — a focused editor with a snippet toolbar and live preview for **sequence, class, state, ER, Gantt** and the rest of the Mermaid family.

Importing or opening a template automatically picks the right surface for you.

### Keyboard shortcuts

| Action | Shortcut |
| --- | --- |
| Undo / Redo | `Ctrl+Z` / `Ctrl+Shift+Z` |
| Copy / Cut / Paste | `Ctrl+C` / `Ctrl+X` / `Ctrl+V` |
| Duplicate | `Ctrl+D` |
| Select all | `Ctrl+A` |
| Group / Ungroup | `Ctrl+G` / `Ctrl+Shift+G` |
| Delete selection | `Del` |
| Apply code → canvas | `Ctrl+Enter` |

---

## 📦 Install

Grab the latest build for your platform from the [**Releases**](https://github.com/russus87/mermaid-forge/releases) page.

| Platform | Asset |
| --- | --- |
| **Linux** | `.AppImage`, `.deb`, `.rpm` |
| **Arch Linux** | `mermaid-forge-*.pkg.tar.zst` |
| **Windows** | `.exe` (NSIS installer) |
| **macOS** | `.dmg` (Apple Silicon & Intel) |

### Arch Linux

```bash
sudo pacman -U mermaid-forge-*.pkg.tar.zst
```

### Debian / Ubuntu

```bash
sudo apt install ./mermaid-forge_*_amd64.deb
```

### AppImage

```bash
chmod +x Mermaid\ Forge_*.AppImage
./Mermaid\ Forge_*.AppImage
```

---

## 🛠️ Development

**Prerequisites:** Node 18+, Rust (stable), and the [Tauri system dependencies](https://tauri.app/start/prerequisites/) for your OS (on Arch: `webkit2gtk-4.1 base-devel`).

```bash
npm install        # install frontend deps
npm run tauri:dev  # run the desktop app with hot-reload
npm run tauri:build  # produce native bundles for the current OS
```

Frontend-only (in a browser, for quick UI iteration):

```bash
npm run dev
```

---

## 🧩 How the sync works

```
            generate.ts                       parse.ts + layout.ts
 ┌────────────┐  ───────────────►  ┌────────────┐  ◄───────────────  ┌────────────┐
 │  Canvas    │   Mermaid source   │  Mermaid   │   rebuild graph    │  Code      │
 │ (React Flow)│ ◄──────────────── │   source   │ ──────────────────►│  editor    │
 └────────────┘                    └────────────┘                    └────────────┘
```

- The canvas is the source of truth; `generate.ts` serializes nodes/edges to a Mermaid `flowchart`.
- When you edit the source and apply it, `parse.ts` reads it back and `layout.ts` runs a lightweight layered (Sugiyama-style) layout so imported graphs look tidy.

## 🗂️ Project layout

```
src/                     React frontend
  components/            Toolbar, Palette, Canvas, Inspector, Code & Preview panels
  mermaid/               generate / parse / layout / node catalog
  store/                 Zustand store (graph state, history, file lifecycle)
  services/              file I/O + SVG/PNG export
src-tauri/               Rust backend (Tauri 2) + bundling config
packaging/arch/          PKGBUILD + .desktop for the Arch .pkg.tar.zst
.github/workflows/       CI + multi-platform release pipeline
```

## 🚀 Releasing

Push a tag and the [release workflow](.github/workflows/release.yml) builds and publishes bundles for Linux, macOS (Apple Silicon + Intel), Windows, and an Arch `.pkg.tar.zst`:

```bash
git tag v0.1.0
git push origin v0.1.0
```

---

## 📄 License

[MIT](LICENSE) © russus87

> Inspired by the idea of *archmind* — visual thinking for system architecture.
