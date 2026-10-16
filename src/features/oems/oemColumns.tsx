import Button, { ButtonVariant } from "@/components/ui/Button";
import SortHeader from "@/components/ui/SortHeader";
import { StatusBadge } from "@/components/ui/Status";
import type { TableColumn } from "@/components/ui/Table";
import { formatDateTime } from "@/utils/formatDateTime";
import type { CmsOem } from "./oemTypes";

type OemColumnActions = {
  sort: string;
  onSort: (sort: string) => void;
  onEdit: (oem: CmsOem) => void;
  onDelete: (oem: CmsOem) => void;
};

export function oemColumns({ sort, onSort, onEdit, onDelete }: OemColumnActions): TableColumn<CmsOem>[] {
  return [
    {
      id: "name",
      header: <SortHeader label="Name" field="name" sort={sort} onSort={onSort} />,
      cell: (oem) => <span className="font-medium text-slate-900">{oem.name}</span>,
    },
    {
      id: "code",
      header: <SortHeader label="Code" field="code" sort={sort} onSort={onSort} />,
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
      cell: (oem) => <StatusBadge status={oem.status} />,
    },
    {
      id: "created",
      header: <SortHeader label="Created" field="created_at" sort={sort} onSort={onSort} />,
      cell: (oem) => <span className="whitespace-nowrap text-slate-600">{formatDateTime(oem.created_at)}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: (oem) => (
        <span className="flex items-center justify-end gap-1">
          <Button
            variant={ButtonVariant.edit}
            aria-label={`Edit ${oem.name}`}
            onClick={(event) => {
              event.stopPropagation();
              onEdit(oem);
            }}
          />
          <Button
            variant={ButtonVariant.delete}
            aria-label={`Delete ${oem.name}`}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(oem);
            }}
          />
        </span>
      ),
    },
  ];
}
