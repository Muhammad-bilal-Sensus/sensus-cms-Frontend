import Button, { ButtonVariant } from "@/components/ui/Button";
import SortHeader from "@/components/ui/SortHeader";
import { StatusBadge } from "@/components/ui/Status";
import type { TableColumn } from "@/components/ui/Table";
import { formatDateTime } from "@/utils/formatDateTime";
import { formatMoney } from "@/utils/formatMoney";
import type { CmsModelTrim } from "./modelTrimTypes";

type TrimColumnActions = {
  sort: string;
  onSort: (sort: string) => void;
  onEdit?: (trim: CmsModelTrim) => void;
  onDelete?: (trim: CmsModelTrim) => void;
};

export function cmsTrimColumns({ sort, onSort, onEdit, onDelete }: TrimColumnActions): TableColumn<CmsModelTrim>[] {
  const columns: TableColumn<CmsModelTrim>[] = [
    {
      id: "name",
      header: <SortHeader label="Trim" field="name" sort={sort} onSort={onSort} />,
      cell: (trim) => <span className="font-medium text-slate-900">{trim.name}</span>,
    },
    {
      id: "code",
      header: "Code",
      cell: (trim) => <span className="text-slate-600">{trim.code}</span>,
    },
    {
      id: "powertrain",
      header: "Powertrain",
      cell: (trim) => <span className="text-slate-600">{trim.powertrain_type || "—"}</span>,
    },
    {
      id: "price",
      header: <SortHeader label="Price" field="price" sort={sort} onSort={onSort} />,
      cell: (trim) => <span className="whitespace-nowrap text-slate-900">{formatMoney(trim.price, trim.currency_code)}</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: (trim) => <StatusBadge status={trim.status} />,
    },
    {
      id: "created",
      header: <SortHeader label="Created" field="created_at" sort={sort} onSort={onSort} />,
      cell: (trim) => <span className="whitespace-nowrap text-slate-600">{formatDateTime(trim.created_at)}</span>,
    },
  ];

  if (!onEdit && !onDelete) return columns;

  columns.push({
    id: "actions",
    header: "",
    cell: (trim) => (
      <span className="flex items-center justify-end gap-1">
        {onEdit ? (
          <Button variant={ButtonVariant.edit} aria-label={`Edit ${trim.name}`} onClick={() => onEdit(trim)} />
        ) : null}
        {onDelete ? (
          <Button variant={ButtonVariant.delete} aria-label={`Delete ${trim.name}`} onClick={() => onDelete(trim)} />
        ) : null}
      </span>
    ),
  });

  return columns;
}
