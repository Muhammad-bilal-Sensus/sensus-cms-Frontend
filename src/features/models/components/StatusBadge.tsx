import type { PublishStatus } from "../modelTypes";

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

