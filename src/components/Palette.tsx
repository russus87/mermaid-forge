import { useMemo, useState } from "react";
import * as Icons from "lucide-react";

import { PALETTE } from "../mermaid/nodeCatalog";

function Icon({ name, color }: { name: string; color: string }) {
  const Comp = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Square;
  return <Comp size={18} color={color} strokeWidth={2.2} />;
}

export function Palette() {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PALETTE;
    return PALETTE.map((g) => ({
      ...g,
      items: g.items.filter(
        (i) =>
          i.label.toLowerCase().includes(q) ||
          (i.kind ?? "").toLowerCase().includes(q),
      ),
    })).filter((g) => g.items.length);
  }, [query]);

  return (
    <aside className="mf-palette">
      <div className="mf-palette-search">
        <Icons.Search size={15} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search components…"
          spellCheck={false}
        />
      </div>

      <div className="mf-palette-scroll">
        {groups.map((group) => (
          <section key={group.id} className="mf-palette-group">
            <h3>{group.title}</h3>
            <div className="mf-palette-items">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  className="mf-palette-item"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/mermaid-forge", item.id);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  title={`Drag “${item.label}” onto the canvas`}
                  style={{ "--accent": item.color } as React.CSSProperties}
                >
                  <span className="mf-palette-icon" style={{ background: `${item.color}1f` }}>
                    <Icon name={item.icon} color={item.color} />
                  </span>
                  <span className="mf-palette-meta">
                    <span className="mf-palette-name">{item.label}</span>
                    {item.kind && <span className="mf-palette-kind">{item.kind}</span>}
                  </span>
                  <Icons.GripVertical size={14} className="mf-palette-grip" />
                </button>
              ))}
            </div>
          </section>
        ))}
        {!groups.length && <p className="mf-empty">No components match “{query}”.</p>}
      </div>
    </aside>
  );
}
