import { useEffect } from "react";
import * as Icons from "lucide-react";

interface Props {
  title: string;
  icon?: keyof typeof Icons;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}

export function Modal({ title, icon, onClose, children, width = 560 }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const I = icon ? (Icons[icon] as Icons.LucideIcon) : null;

  return (
    <div className="mf-modal-overlay" onMouseDown={onClose}>
      <div
        className="mf-modal"
        style={{ width }}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className="mf-modal-head">
          <span className="mf-modal-title">
            {I && <I size={17} />} {title}
          </span>
          <button className="mf-modal-close" onClick={onClose} aria-label="Close">
            <Icons.X size={17} />
          </button>
        </header>
        <div className="mf-modal-body">{children}</div>
      </div>
    </div>
  );
}
