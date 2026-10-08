import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  align?: "start" | "center";
  compact?: boolean;
  hideTitle?: boolean;
};

const widths = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
};

export default function Modal({
  open,
  title,
  description,
  onClose,
  children,
  size = "lg",
  align = "start",
  compact = false,
  hideTitle = false,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`flex max-h-[90vh] w-full ${widths[size]} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <header
          className={
            hideTitle
              ? "relative h-8"
              : align === "center"
                ? compact
                  ? "relative px-5 pt-3 pb-0"
                  : "relative px-6 pt-5 pb-1"
                : "flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4"
          }
        >
          {hideTitle ? null : (
            <div className={align === "center" ? "px-8 text-center" : undefined}>
              <h2 id="modal-title" className="text-base font-semibold text-slate-900">
                {title}
              </h2>
              {description ? (
                <p className={`mt-0.5 ${align === "center" && !compact ? "text-sm text-slate-400" : "text-xs text-slate-500"}`}>{description}</p>
              ) : null}
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 ${
              align === "center" ? `absolute right-3 ${compact ? "top-2.5" : "top-4"}` : ""
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6 18 18M18 6 6 18" />
            </svg>
          </button>
        </header>
        <div className={`thin-scroll overflow-y-auto ${compact ? "px-5 pt-2 pb-4" : "px-6 py-5"}`}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
