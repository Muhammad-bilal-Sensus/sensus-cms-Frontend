import { PencilIcon, TrashIcon } from "@/components/icons/Icon";
import type { TableColumn } from "@/components/ui/Table";
import { oemStatusLabel, oemStatusTone } from "@/features/oems/oemTypes";
import type { CmsMicrosite } from "./micrositeTypes";

function StatusPill({ status }: { status: string }) {
  const tone = oemStatusTone[status as keyof typeof oemStatusTone] ?? "bg-slate-100 text-slate-500";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{oemStatusLabel(status)}</span>;
}

type MicrositeColumnActions = {
  onEdit: (site: CmsMicrosite) => void;
  onDelete: (site: CmsMicrosite) => void;
};

export function micrositeColumns({ onEdit, onDelete }: MicrositeColumnActions): TableColumn<CmsMicrosite>[] {
  return [
    { id: "name", header: "Name", cell: (site) => <span className="font-medium text-slate-900">{site.name}</span> },
    { id: "slug", header: "Slug", cell: (site) => <span className="font-mono text-xs text-slate-600">{site.slug}</span> },
    { id: "domain", header: "Domain", cell: (site) => <span className="text-slate-600">{site.domain}</span> },
    { id: "locale", header: "Locale", cell: (site) => <span className="text-slate-600">{site.settings?.locale || "—"}</span> },
    { id: "currency", header: "Currency", cell: (site) => <span className="text-slate-600">{site.settings?.currency || "—"}</span> },
    { id: "status", header: "Status", cell: (site) => <StatusPill status={site.status} /> },
    {
      id: "actions",
      header: "",
      cell: (site) => (
        <span className="flex items-center justify-end gap-1">
          <button
            type="button"
            aria-label={`Edit ${site.name}`}
            onClick={() => onEdit(site)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-teal-700 hover:bg-teal-50"
          >
            <PencilIcon />
          </button>
          <button
            type="button"
            aria-label={`Delete ${site.name}`}
            onClick={() => onDelete(site)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-rose-600 hover:bg-rose-50"
          >
            <TrashIcon />
          </button>
        </span>
      ),
    },
  ];
}
