import { Icon, PencilIcon, TrashIcon } from "@/components/icons/Icon";
import type { TableColumn } from "@/components/ui/Table";
import { oemStatusLabel, oemStatusTone, type CmsOem } from "./oemTypes";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function StatusPill({ status }: { status: string }) {
  const tone = oemStatusTone[status as keyof typeof oemStatusTone] ?? "bg-slate-100 text-slate-500";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{oemStatusLabel(status)}</span>;
}

type OemColumnActions = {
  onEdit: (oem: CmsOem) => void;
  onDelete: (oem: CmsOem) => void;
  expandedOemId?: number | null;
};

export function oemColumns({ onEdit, onDelete, expandedOemId }: OemColumnActions): TableColumn<CmsOem>[] {
  return [
    {
      id: "name",
      header: "Name",
      cell: (oem) => (
        <span className="flex items-center gap-2">
          {expandedOemId !== undefined ? (
            <Icon
              name="chevronRight"
              className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${expandedOemId === oem.id ? "rotate-90" : ""}`}
            />
          ) : null}
          <span className="font-medium text-slate-900">{oem.name}</span>
        </span>
      ),
    },
    {
      id: "code",
      header: "Code",
      cell: (oem) => <span className="font-mono text-xs text-slate-600">{oem.code}</span>,
    },
    {
      id: "description",
      header: "Description",
      cell: (oem) => (
        <span className="block max-w-md truncate text-slate-600" title={oem.description ?? undefined}>
          {oem.description?.trim() || "—"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (oem) => <StatusPill status={oem.status} />,
    },
    {
      id: "created",
      header: "Created",
      cell: (oem) => <span className="whitespace-nowrap text-slate-600">{formatDateTime(oem.created_at)}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: (oem) => (
        <span className="flex items-center justify-end gap-1">
          <button
            type="button"
            aria-label={`Edit ${oem.name}`}
            onClick={(event) => {
              event.stopPropagation();
              onEdit(oem);
            }}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-teal-700 hover:bg-teal-50"
          >
            <PencilIcon />
          </button>
          <button
            type="button"
            aria-label={`Delete ${oem.name}`}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(oem);
            }}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-rose-600 hover:bg-rose-50"
          >
            <TrashIcon />
          </button>
        </span>
      ),
    },
  ];
}
