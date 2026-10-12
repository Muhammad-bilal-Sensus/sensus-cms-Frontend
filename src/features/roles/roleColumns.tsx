import { PencilIcon, TrashIcon } from "@/components/icons/Icon";
import type { TableColumn } from "@/components/ui/Table";
import type { CmsRole } from "./roleTypes";

type RoleColumnActions = {
  canManage: boolean;
  onOpen: (role: CmsRole) => void;
  onDelete: (role: CmsRole) => void;
};

export function roleColumns({ canManage, onOpen, onDelete }: RoleColumnActions): TableColumn<CmsRole>[] {
  return [
    {
      id: "name",
      header: "Role",
      cell: (role) => (
        <button type="button" onClick={() => onOpen(role)} className="cursor-pointer text-left font-medium text-slate-900 hover:text-teal-800">
          {role.name}
        </button>
      ),
    },
    {
      id: "description",
      header: "Description",
      cell: (role) => <span className="block max-w-md truncate text-slate-600">{role.description || "—"}</span>,
    },
    {
      id: "type",
      header: "Type",
      cell: (role) => (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${role.is_system ? "bg-slate-100 text-slate-600" : "bg-[#dcecdf] text-[#287560]"}`}>
          {role.is_system ? "System" : "Custom"}
        </span>
      ),
    },
    {
      id: "permissions",
      header: "Permissions",
      cell: (role) => <span className="text-slate-600">{role.permissions.length}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: (role) => (
        <span className="flex items-center justify-end gap-1">
          <button
            type="button"
            aria-label={`Open ${role.name}`}
            onClick={() => onOpen(role)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-teal-700 hover:bg-teal-50"
          >
            <PencilIcon />
          </button>
          {canManage && !role.is_system ? (
            <button
              type="button"
              aria-label={`Delete ${role.name}`}
              onClick={() => onDelete(role)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-rose-600 hover:bg-rose-50"
            >
              <TrashIcon />
            </button>
          ) : null}
        </span>
      ),
    },
  ];
}
