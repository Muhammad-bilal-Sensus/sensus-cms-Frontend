import type { ReactNode } from "react";

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-slate-600">
      {label}
      {children}
      {error ? <span className="font-normal text-rose-600">{error}</span> : null}
      {!error && hint ? <span className="font-normal text-slate-400">{hint}</span> : null}
    </label>
  );
}

