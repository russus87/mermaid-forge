const KEY = "mermaid-forge:recent:v1";
const CAP = 8;

export interface RecentFile {
  path: string;
  name: string;
  at: number;
}

export function getRecent(): RecentFile[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecentFile[]) : [];
  } catch {
    return [];
  }
}

export function pushRecent(path: string): void {
  if (!path) return;
  const name = path.split(/[\\/]/).pop() ?? path;
  const next = [
    { path, name, at: Date.now() },
    ...getRecent().filter((r) => r.path !== path),
  ].slice(0, CAP);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function clearRecent(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
