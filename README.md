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
- **OpenShift / cloud-native palette** — first-class nodes for *Cluster, Project, Pod, Deployment, Service, Route, Ingress, ConfigMap, Secret, PVC, Operator, Registry* and more, so you can sketch the architecture of an OpenShift environment in seconds.
- **Classic flowchart shapes** — process, decision, stadium, cylinder, hexagon, subroutine, parallelogram, and others.
- **Live Mermaid preview** — render the real Mermaid output side-by-side.
- **Polished, professional UI** — refined dark & light themes, glassy panels, a minimap, snapping grid, and accent-colored nodes.
- **Export** — `.mmd` source, **SVG**, and high-resolution **PNG**. Save/open native `.forge.json` projects (positions, colors, everything).
- **Undo / redo**, keyboard shortcuts, and instant search across the component palette.

## 🖼️ Diagram types

The visual canvas focuses on **graph-shaped** diagrams (flowcharts and architecture). The live preview renders any Mermaid diagram, and the source editor lets you author **sequence, class, state, ER** and the rest of the Mermaid family directly.

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
