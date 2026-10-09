import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { usePermission } from "../access/usePermission";
import { Icon } from "./icons";
import { sideNav, topNav } from "./navigation";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AllModulesModal({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const { canAny } = usePermission();
  const modules = [...sideNav, ...topNav].filter((item) => canAny(item.permissions ?? []));

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const visible = modules.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="All Modules"
        className="flex max-h-[86vh] w-full max-w-5xl flex-col rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-medium text-slate-900">All Modules</h2>
          <div className="flex items-center gap-3">
            <label className="relative">
              <span className="sr-only">Search modules</span>
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search modules..."
                className="h-10 w-56 rounded-full border border-slate-200 pr-10 pl-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-300 sm:w-64"
              />
              <Icon name="search" className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </label>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6 18 18M18 6 6 18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="thin-scroll overflow-y-auto pr-1">
          {visible.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">No modules found</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {visible.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex min-h-24 flex-col items-center justify-center gap-3 rounded-xl border px-3 py-6 text-center text-sm ${
                      isActive
                        ? "border-slate-500 bg-slate-100 font-medium text-slate-900"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                    }`
                  }
                >
                  <Icon name={item.icon} className="h-7 w-7" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
