import { PencilIcon, TrashIcon } from "@/components/icons/Icon";
import SortHeader from "@/components/ui/SortHeader";
import { StatusBadge } from "@/components/ui/Status";
import type { TableColumn } from "@/components/ui/Table";
import type { CmsBranch } from "./branchTypes";

function textOrDash(value: string | null | undefined) {
  const text = value?.trim();
  return text ? text : "—";
}

type BranchColumnActions = {
  sort: string;
  onSort: (sort: string) => void;
  onEdit: (branch: CmsBranch) => void;
  onDelete: (branch: CmsBranch) => void;
};

export function branchColumns({ sort, onSort, onEdit, onDelete }: BranchColumnActions): TableColumn<CmsBranch>[] {
  return [
    {
      id: "name",
      header: <SortHeader label="Name" field="name" sort={sort} onSort={onSort} />,
      cell: (branch) => <span className="font-medium text-slate-900">{branch.name}</span>,
    },
    {
      id: "code",
      header: <SortHeader label="Code" field="code" sort={sort} onSort={onSort} />,
      cell: (branch) => <span className="font-mono text-xs text-slate-600">{branch.code}</span>,
    },
    {
      id: "city",
      header: <SortHeader label="City" field="city" sort={sort} onSort={onSort} />,
      cell: (branch) => <span className="text-slate-600">{textOrDash(branch.city)}</span>,
    },
    {
      id: "phone",
      header: <SortHeader label="Phone" field="phone" sort={sort} onSort={onSort} />,
      cell: (branch) => <span className="whitespace-nowrap text-slate-600">{textOrDash(branch.phone)}</span>,
    },
    {
      id: "status",
      header: <SortHeader label="Status" field="status" sort={sort} onSort={onSort} />,
      cell: (branch) => <StatusBadge status={branch.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: (branch) => (
        <span className="flex items-center justify-end gap-1">
          <button
            type="button"
            aria-label={`Edit ${branch.name}`}
            onClick={(event) => {
              event.stopPropagation();
              onEdit(branch);
            }}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-teal-700 hover:bg-teal-50"
          >
            <PencilIcon />
          </button>
          <button
            type="button"
            aria-label={`Delete ${branch.name}`}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(branch);
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
