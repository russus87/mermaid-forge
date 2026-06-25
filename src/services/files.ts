/**
 * File I/O that works both inside the Tauri shell (native dialogs + fs) and
 * in a plain browser during `vite dev` (download / file-input fallback).
 */

interface SaveOptions {
  defaultName: string;
  filters: { name: string; extensions: string[] }[];
  contents: string | Uint8Array;
}

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function saveFile(opts: SaveOptions): Promise<string | null> {
  if (isTauri()) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeTextFile, writeFile } = await import("@tauri-apps/plugin-fs");
    const path = await save({
      defaultPath: opts.defaultName,
      filters: opts.filters,
    });
    if (!path) return null;
    if (typeof opts.contents === "string") {
      await writeTextFile(path, opts.contents);
    } else {
      await writeFile(path, opts.contents);
    }
    return path;
  }

  // Browser fallback: trigger a download.
  const blob =
    typeof opts.contents === "string"
      ? new Blob([opts.contents], { type: "text/plain" })
      : new Blob([opts.contents as BlobPart]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = opts.defaultName;
  a.click();
  URL.revokeObjectURL(url);
  return opts.defaultName;
}

export async function openTextFile(filters: { name: string; extensions: string[] }[]): Promise<
  { path: string | null; contents: string } | null
> {
  if (isTauri()) {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const { readTextFile } = await import("@tauri-apps/plugin-fs");
    const selected = await open({ multiple: false, filters });
    if (!selected || Array.isArray(selected)) return null;
    const contents = await readTextFile(selected);
    return { path: selected, contents };
  }

  // Browser fallback: hidden file input.
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = filters.flatMap((f) => f.extensions.map((e) => `.${e}`)).join(",");
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      resolve({ path: null, contents: await file.text() });
    };
    input.click();
  });
}
