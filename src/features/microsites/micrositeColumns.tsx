import { SyncIcon } from "@/components/icons/Icon";
import Button, { ButtonVariant } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Status";
import type { TableColumn } from "@/components/ui/Table";
import type { CmsMicrosite } from "./micrositeTypes";

type MicrositeColumnActions = {
  onSync: (site: CmsMicrosite) => void;
  onEdit: (site: CmsMicrosite) => void;
  onDelete: (site: CmsMicrosite) => void;
};

export function micrositeColumns({ onSync, onEdit, onDelete }: MicrositeColumnActions): TableColumn<CmsMicrosite>[] {
  return [
    { id: "name", header: "Name", cell: (site) => <span className="font-medium text-slate-900">{site.name}</span> },
    { id: "slug", header: "Slug", cell: (site) => <span className="font-mono text-xs text-slate-600">{site.slug}</span> },
    { id: "domain", header: "Domain", cell: (site) => <span className="text-slate-600">{site.domain}</span> },
    { id: "locale", header: "Locale", cell: (site) => <span className="text-slate-600">{site.settings?.locale || "—"}</span> },
    { id: "currency", header: "Currency", cell: (site) => <span className="text-slate-600">{site.settings?.currency || "—"}</span> },
    { id: "status", header: "Status", cell: (site) => <StatusBadge status={site.status} /> },
    {
      id: "sync",
      header: "Sync locations",
      cell: (site) => (
        <button
          type="button"
          aria-label={`Sync locations for ${site.name}`}
          onClick={() => onSync(site)}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-teal-700 hover:bg-teal-50"
        >
          <SyncIcon className="h-4 w-4" />
        </button>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (site) => (
        <span className="flex items-center justify-end gap-1">
          <Button variant={ButtonVariant.edit} aria-label={`Edit ${site.name}`} onClick={() => onEdit(site)} />
          <Button variant={ButtonVariant.delete} aria-label={`Delete ${site.name}`} onClick={() => onDelete(site)} />
        </span>
      ),
    },
  ];
}
