import { AppRole } from "@/access/roles";
import { PencilIcon, TrashIcon } from "@/components/icons/Icon";
import type { TableColumn } from "@/components/ui/Table";
import type { CmsUser } from "./userTypes";

const statusTone: Record<string, string> = {
  active: "bg-[#dcecdf] text-[#287560]",
  inactive: "bg-slate-100 text-slate-500",
  suspended: "bg-[#f4dddd] text-[#b44850]",
};

function formatDateTime(value: string | null) {
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

function StatusPill({ status }: { status: string }) {
  const tone = statusTone[status] ?? "bg-slate-100 text-slate-500";
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{label}</span>;
}

type UserColumnActions = {
  canEdit: boolean;
  canDelete: boolean;
  currentUserId?: number;
  isSuperAdmin: boolean;
  onEdit: (user: CmsUser) => void;
  onDelete: (user: CmsUser) => void;
};

export function userColumns({
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
      header: "User",
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
      cell: (user) => <StatusPill status={user.status} />,
    },
    {
      id: "lastLogin",
      header: "Last login",
      cell: (user) => <span className="text-slate-600">{formatDateTime(user.last_login_at)}</span>,
    },
    {
      id: "created",
      header: "Created",
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
              <button
                type="button"
                aria-label={`Edit ${user.full_name}`}
                onClick={() => onEdit(user)}
                className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-full text-teal-700 hover:bg-teal-50"
              >
                <PencilIcon />
              </button>
            ) : null}
            {showDelete ? (
              <button
                type="button"
                aria-label={`Delete ${user.full_name}`}
                onClick={() => onDelete(user)}
                className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-full text-rose-600 hover:bg-rose-50"
              >
                <TrashIcon />
              </button>
            ) : null}
          </span>
        );
      },
    },
  ];
}
