import * as Icons from "lucide-react";

import { Modal } from "./Modal";
import { useStore } from "../store/useStore";
import { TEMPLATES, type Template } from "../mermaid/templates";

function Icon({ name }: { name: string }) {
  const Comp = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Square;
  return <Comp size={20} />;
}

export function TemplateGallery({ onClose }: { onClose: () => void }) {
  const loadTemplate = useStore((s) => s.loadTemplate);

  function pick(t: Template) {
    loadTemplate(t);
    onClose();
  }

  return (
    <Modal title="New from template" icon="LayoutTemplate" onClose={onClose} width={720}>
      <p className="mf-modal-lead">
        Pick a starting point. Graph-shaped templates open in the drag-and-drop
        canvas; the rest open in the code editor with live preview.
      </p>
      <div className="mf-template-grid">
        {TEMPLATES.map((t) => (
          <button key={t.id} className="mf-template-card" onClick={() => pick(t)}>
            <span className={`mf-template-icon ${t.mode}`}>
              <Icon name={t.icon} />
            </span>
            <span className="mf-template-meta">
              <span className="mf-template-name">{t.name}</span>
              <span className="mf-template-desc">{t.description}</span>
            </span>
            <span className={`mf-template-badge ${t.mode}`}>
              {t.mode === "visual" ? "Visual" : "Code"}
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
