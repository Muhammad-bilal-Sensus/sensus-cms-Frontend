import { LayersIcon } from "@/components/icons/Icon";
import Button, { ButtonVariant } from "@/components/ui/Button";
import SortHeader from "@/components/ui/SortHeader";
import { StatusBadge } from "@/components/ui/Status";
import type { TableColumn } from "@/components/ui/Table";
import { formatDateTime } from "@/utils/formatDateTime";
import type { CmsVehicleModel } from "./vehicleModelTypes";

type ModelColumnActions = {
  sort: string;
  onSort: (sort: string) => void;
  onOpen: (model: CmsVehicleModel) => void;
  onEdit?: (model: CmsVehicleModel) => void;
  onDelete?: (model: CmsVehicleModel) => void;
};

export function modelColumns({ sort, onSort, onOpen, onEdit, onDelete }: ModelColumnActions): TableColumn<CmsVehicleModel>[] {
  const columns: TableColumn<CmsVehicleModel>[] = [
    {
      id: "name",
      header: <SortHeader label="Name" field="name" sort={sort} onSort={onSort} />,
      cell: (model) => (
        <span>
          <span className="block font-medium text-slate-900">{model.name}</span>
          <span className="block text-xs text-slate-400">{model.slug || "—"}</span>
        </span>
      ),
    },
    {
      id: "code",
      header: <SortHeader label="Code" field="code" sort={sort} onSort={onSort} />,
      cell: (model) => <span className="text-slate-600">{model.code}</span>,
    },
    {
      id: "body",
      header: "Body type",
      cell: (model) => <span className="text-slate-600">{model.body_type || "—"}</span>,
    },
    {
      id: "featured",
      header: "Featured",
      cell: (model) => <span className="text-slate-600">{model.is_featured ? "Yes" : "No"}</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: (model) => <StatusBadge status={model.status} />,
    },
    {
      id: "created",
      header: <SortHeader label="Created" field="created_at" sort={sort} onSort={onSort} />,
      cell: (model) => <span className="whitespace-nowrap text-slate-600">{formatDateTime(model.created_at)}</span>,
    },
  ];

  columns.push({
    id: "versions",
    header: "Variants",
    cell: (model) => (
      <Button variant={ButtonVariant.icon} aria-label={`Variants for ${model.name}`} onClick={() => onOpen(model)}>
        <LayersIcon className="h-4 w-4" />
      </Button>
    ),
  });

  if (!onEdit && !onDelete) return columns;

  columns.push({
    id: "actions",
    header: "",
    cell: (model) => (
      <span className="flex items-center justify-end gap-1">
        {onEdit ? (
          <Button variant={ButtonVariant.edit} aria-label={`Edit ${model.name}`} onClick={() => onEdit(model)} />
        ) : null}
        {onDelete ? (
          <Button variant={ButtonVariant.delete} aria-label={`Delete ${model.name}`} onClick={() => onDelete(model)} />
        ) : null}
      </span>
    ),
  });

  return columns;
}
