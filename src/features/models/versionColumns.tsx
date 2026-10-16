import { Icon } from "@/components/icons/Icon";
import Button, { ButtonVariant } from "@/components/ui/Button";
import SortHeader from "@/components/ui/SortHeader";
import { StatusBadge } from "@/components/ui/Status";
import type { TableColumn } from "@/components/ui/Table";
import { formatDateTime } from "@/utils/formatDateTime";
import type { CmsModelVersion } from "./modelVersionTypes";

function formatDate(value: string | null) {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

type VersionColumnActions = {
  sort: string;
  onSort: (sort: string) => void;
  onOpenTrims: (version: CmsModelVersion) => void;
  onEdit?: (version: CmsModelVersion) => void;
  onDelete?: (version: CmsModelVersion) => void;
};

export function versionColumns({ sort, onSort, onOpenTrims, onEdit, onDelete }: VersionColumnActions): TableColumn<CmsModelVersion>[] {
  const columns: TableColumn<CmsModelVersion>[] = [
    {
      id: "name",
      header: <SortHeader label="Version" field="name" sort={sort} onSort={onSort} />,
      cell: (version) => <span className="font-medium text-slate-900">{version.name}</span>,
    },
    {
      id: "code",
      header: "Code",
      cell: (version) => <span className="text-slate-600">{version.code}</span>,
    },
    {
      id: "year",
      header: <SortHeader label="Year" field="model_year" sort={sort} onSort={onSort} />,
      cell: (version) => <span className="text-slate-600">{version.model_year}</span>,
    },
    {
      id: "launch",
      header: "Launch",
      cell: (version) => <span className="whitespace-nowrap text-slate-600">{formatDate(version.launch_date)}</span>,
    },
    {
      id: "end",
      header: "End",
      cell: (version) => <span className="whitespace-nowrap text-slate-600">{formatDate(version.end_date)}</span>,
    },
    {
      id: "sections",
      header: "Sections",
      cell: (version) => <span className="text-slate-600">{version.content_sections.length}</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: (version) => <StatusBadge status={version.status} />,
    },
    {
      id: "created",
      header: <SortHeader label="Created" field="created_at" sort={sort} onSort={onSort} />,
      cell: (version) => <span className="whitespace-nowrap text-slate-600">{formatDateTime(version.created_at)}</span>,
    },
  ];

  columns.push({
    id: "trims",
    header: "Trims",
    cell: (version) => (
      <button
        type="button"
        aria-label={`Trims for ${version.name}`}
        onClick={() => onOpenTrims(version)}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-teal-700 hover:bg-teal-50"
      >
        <Icon name="tag" className="h-4 w-4" />
      </button>
    ),
  });

  if (!onEdit && !onDelete) return columns;

  columns.push({
    id: "actions",
    header: "",
    cell: (version) => (
      <span className="flex items-center justify-end gap-1">
        {onEdit ? (
          <Button variant={ButtonVariant.edit} aria-label={`Edit ${version.name}`} onClick={() => onEdit(version)} />
        ) : null}
        {onDelete ? (
          <Button variant={ButtonVariant.delete} aria-label={`Delete ${version.name}`} onClick={() => onDelete(version)} />
        ) : null}
      </span>
    ),
  });

  return columns;
}
