import type { ReactNode } from "react";
import type { PublishStatus } from "../../modules/models/types";

const statusClass: Record<PublishStatus, string> = {
  published: "bg-[#dcecdf] text-[#287560]",
  draft: "bg-[#f7e3d7] text-[#bd672f]",
  inactive: "bg-slate-100 text-slate-500",
};

const statusLabel: Record<PublishStatus, string> = {
  published: "Published",
  draft: "Draft",
  inactive: "Inactive",
};

export function StatusBadge({ status }: { status: PublishStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass[status]}`}>
      {statusLabel[status]}
    </span>
  );
}

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

