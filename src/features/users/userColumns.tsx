import { AppRole } from "@/access/roles";
import Button, { ButtonVariant } from "@/components/ui/Button";
import SortHeader from "@/components/ui/SortHeader";
import { StatusBadge } from "@/components/ui/Status";
import type { TableColumn } from "@/components/ui/Table";
import { formatDateTime } from "@/utils/formatDateTime";
import type { CmsUser } from "./userTypes";

function actorLabel(actor: CmsUser["created_by"]) {
  if (!actor) return "—";
  if (actor.full_name?.trim()) return actor.full_name;
  const name = `${actor.first_name ?? ""} ${actor.last_name ?? ""}`.trim();
  return name || actor.email || "—";
}

function initials(user: CmsUser) {
  const letters = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase();
  return letters || user.email[0]?.toUpperCase() || "?";
}

type UserColumnActions = {
  sort: string;
  onSort: (sort: string) => void;
  canEdit: boolean;
  canDelete: boolean;
  currentUserId?: number;
  isSuperAdmin: boolean;
  onEdit: (user: CmsUser) => void;
  onDelete: (user: CmsUser) => void;
};

export function userColumns({
  sort,
  onSort,
  canEdit,
  canDelete,
  currentUserId,
  isSuperAdmin,
  onEdit,
  onDelete,
}: UserColumnActions): TableColumn<CmsUser>[] {
  return [
    {
      id: "user",
      header: <SortHeader label="User" field="first_name" sort={sort} onSort={onSort} />,
      cell: (user) => (
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#dcecdf] text-xs font-semibold text-[#287560]">
            {initials(user)}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-slate-900">{user.full_name}</span>
            <span className="block truncate text-xs text-slate-400">{user.email}</span>
          </span>
        </span>
      ),
    },
    {
      id: "role",
      header: "Role",
      cell: (user) => <span className="text-slate-600">{user.role?.name ?? "—"}</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: (user) => <StatusBadge status={user.status} />,
    },
    {
      id: "lastLogin",
      header: "Last login",
      cell: (user) => <span className="text-slate-600">{formatDateTime(user.last_login_at)}</span>,
    },
    {
      id: "created",
      header: <SortHeader label="Created" field="created_at" sort={sort} onSort={onSort} />,
      cell: (user) => <span className="whitespace-nowrap text-slate-600">{formatDateTime(user.created_at)}</span>,
    },
    {
      id: "createdBy",
      header: "Created by",
      cell: (user) => <span className="text-slate-600">{actorLabel(user.created_by)}</span>,
    },
    {
      id: "updatedBy",
      header: "Updated by",
      cell: (user) => <span className="text-slate-600">{actorLabel(user.updated_by)}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: (user) => {
        const lockedSuperAdmin = user.role?.code === AppRole.SuperAdministrator && !isSuperAdmin;
        const showEdit = canEdit && !lockedSuperAdmin;
        const showDelete = canDelete && user.id !== currentUserId && !lockedSuperAdmin;
        if (!showEdit && !showDelete) return null;
        return (
          <span className="flex items-center justify-end gap-1">
            {showEdit ? (
              <Button variant={ButtonVariant.edit} aria-label={`Edit ${user.full_name}`} onClick={() => onEdit(user)} />
            ) : null}
            {showDelete ? (
              <Button variant={ButtonVariant.delete} aria-label={`Delete ${user.full_name}`} onClick={() => onDelete(user)} />
            ) : null}
          </span>
        );
      },
    },
  ];
}
