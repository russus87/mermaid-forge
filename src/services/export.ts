import mermaid from "mermaid";
import { jsPDF } from "jspdf";

let idCounter = 0;

/** Render Mermaid source to a standalone SVG string. */
export async function renderSvg(code: string, theme: "dark" | "light"): Promise<string> {
  mermaid.initialize({
    startOnLoad: false,
    theme: theme === "dark" ? "dark" : "default",
    securityLevel: "loose",
    flowchart: { curve: "basis", htmlLabels: true },
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  });
  const { svg } = await mermaid.render(`mf-export-${idCounter++}`, code);
  return svg;
}

interface Raster {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

/** Draw an SVG string onto a canvas at the given scale. */
async function rasterize(svg: string, scale: number): Promise<Raster> {
  const sized = ensureSize(svg);
  const blob = new Blob([sized.svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "sync";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load SVG for export"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sized.width * scale));
    canvas.height = Math.max(1, Math.round(sized.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, sized.width, sized.height);
    return { canvas, width: sized.width, height: sized.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Rasterize an SVG string to PNG bytes. */
export async function svgToPng(svg: string, scale = 2): Promise<Uint8Array> {
  const { canvas } = await rasterize(svg, scale);
  return dataUrlToBytes(canvas.toDataURL("image/png"));
}

/** Copy the rendered diagram to the clipboard as a PNG image. */
export async function copyPngToClipboard(svg: string, scale = 2): Promise<void> {
  const { canvas } = await rasterize(svg, scale);
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"),
  );
  if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
    throw new Error("Clipboard image copy is not supported here");
  }
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}

/** Render the diagram into a single-page PDF sized to the image. */
export async function svgToPdf(svg: string, scale = 2): Promise<Uint8Array> {
  const { canvas, width, height } = await rasterize(svg, scale);
  const dataUrl = canvas.toDataURL("image/png");
  const orientation = width >= height ? "landscape" : "portrait";
  const pdf = new jsPDF({ orientation, unit: "pt", format: [width, height] });
  pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
  return new Uint8Array(pdf.output("arraybuffer"));
}

function ensureSize(svg: string): { svg: string; width: number; height: number } {
  const wMatch = svg.match(/width="([\d.]+)"/);
  const hMatch = svg.match(/height="([\d.]+)"/);
  let width = wMatch ? parseFloat(wMatch[1]) : 0;
  let height = hMatch ? parseFloat(hMatch[1]) : 0;
  if (!width || !height) {
    const vb = svg.match(/viewBox="[\d.]+ [\d.]+ ([\d.]+) ([\d.]+)"/);
    if (vb) {
      width = width || parseFloat(vb[1]);
      height = height || parseFloat(vb[2]);
    }
  }
  width = width || 1200;
  height = height || 800;
  return { svg, width, height };
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
