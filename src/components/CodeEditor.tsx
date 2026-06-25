import { useLayoutEffect, useRef } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
}

/**
 * A lightweight, fully offline code editor: a textarea with a synced line
 * gutter and tab handling. Avoids shipping a CDN-loaded editor inside the
 * packaged Tauri app while still feeling like a real code surface.
 */
export function CodeEditor({ value, onChange, readOnly }: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lineCount = value.split("\n").length;

  useLayoutEffect(() => {
    const ta = taRef.current;
    const g = gutterRef.current;
    if (!ta || !g) return;
    const sync = () => {
      g.scrollTop = ta.scrollTop;
    };
    ta.addEventListener("scroll", sync);
    return () => ta.removeEventListener("scroll", sync);
  }, []);

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const { selectionStart, selectionEnd } = ta;
      const next = value.slice(0, selectionStart) + "    " + value.slice(selectionEnd);
      onChange(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = selectionStart + 4;
      });
    }
  }

  return (
    <div className="mf-code-editor">
      <div className="mf-code-gutter" ref={gutterRef}>
        {Array.from({ length: lineCount }, (_, i) => (
          <span key={i}>{i + 1}</span>
        ))}
      </div>
      <textarea
        ref={taRef}
        className="mf-code-area"
        value={value}
        spellCheck={false}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        wrap="off"
      />
    </div>
  );
}
