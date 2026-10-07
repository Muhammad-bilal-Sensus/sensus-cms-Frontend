import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import AddUserModal from "../../../components/ui/AddUserModal";
import Button from "../../../components/ui/Button";
import DeleteUserModal from "../../../components/ui/DeleteUserModal";
import EditUserModal from "../../../components/ui/EditUserModal";
import Input from "../../../components/ui/Input";
import Pagination from "../../../components/ui/Pagination";
import Select from "../../../components/ui/Select";
import Table, { type TableColumn } from "../../../components/ui/Table";
import { useAuth } from "../../../hooks/useAuth";
import { fetchRoles, roleKeys } from "../../../services/roleService";
import { fetchUsers, userKeys, type FetchUsersParams } from "../../../services/userService";
import type { CmsUser, SortDirection, UserSortBy } from "../../../types/user";
import { getApiErrorMessage } from "../../../utils/apiError";

const pageSizeOptions = [10, 15, 25, 50];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

const sortOptions = [
  { value: "created_at:desc", label: "Newest first" },
  { value: "created_at:asc", label: "Oldest first" },
  { value: "first_name:asc", label: "Name A–Z" },
  { value: "first_name:desc", label: "Name Z–A" },
  { value: "email:asc", label: "Email A–Z" },
  { value: "email:desc", label: "Email Z–A" },
];

const statusTone: Record<string, string> = {
  active: "bg-[#dcecdf] text-[#287560]",
  inactive: "bg-slate-100 text-slate-500",
  suspended: "bg-[#f4dddd] text-[#b44850]",
};

function useDebouncedValue(value: string, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function parseSort(value: string): { sortBy: UserSortBy; sortDir: SortDirection } {
  const [field, direction] = value.split(":");
  const sortBy: UserSortBy = field === "first_name" || field === "email" ? field : "created_at";
  const sortDir: SortDirection = direction === "asc" ? "asc" : "desc";
  return { sortBy, sortDir };
}

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

function initials(user: CmsUser) {
  const letters = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase();
  return letters || user.email[0]?.toUpperCase() || "?";
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 48 56" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#d32f2f"
        fillRule="evenodd"
        d="M4 17.5h40a2.5 2.5 0 0 0 2.5-2.5v-4A2.5 2.5 0 0 0 44 8.5H31V6.2A3.2 3.2 0 0 0 27.8 3h-7.6A3.2 3.2 0 0 0 17 6.2V8.5H4A2.5 2.5 0 0 0 1.5 11v4A2.5 2.5 0 0 0 4 17.5Zm14.2-11.3h11.6a1 1 0 0 1 1 1V9H17.2V7.2a1 1 0 0 1 1-1ZM6 20h36v28.5a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V20Zm7.2 6h3.2a1.6 1.6 0 0 1 1.6 1.6v16.8a1.6 1.6 0 0 1-1.6 1.6h-3.2a1.6 1.6 0 0 1-1.6-1.6V27.6A1.6 1.6 0 0 1 13.2 26Zm9.2 0h3.2a1.6 1.6 0 0 1 1.6 1.6v16.8a1.6 1.6 0 0 1-1.6 1.6h-3.2a1.6 1.6 0 0 1-1.6-1.6V27.6a1.6 1.6 0 0 1 1.6-1.6Zm9.2 0h3.2a1.6 1.6 0 0 1 1.6 1.6v16.8a1.6 1.6 0 0 1-1.6 1.6H31.6a1.6 1.6 0 0 1-1.6-1.6V27.6a1.6 1.6 0 0 1 1.6-1.6Z"
      />
    </svg>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone = statusTone[status] ?? "bg-slate-100 text-slate-500";
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{label}</span>;
}

export default function UsersPage() {
  const { user: sessionUser } = useAuth();
  const currentUserId = sessionUser?.id;
  const canAddUser = sessionUser?.role?.is_system === true;
  const [search, setSearch] = useState("");
  const [roleId, setRoleId] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("created_at:desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [addOpen, setAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CmsUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<CmsUser | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  const filterKey = `${debouncedSearch}|${roleId}|${status}|${sort}|${perPage}`;
  const [syncedFilterKey, setSyncedFilterKey] = useState(filterKey);
  if (syncedFilterKey !== filterKey) {
    setSyncedFilterKey(filterKey);
    setPage(1);
  }
  const requestPage = syncedFilterKey === filterKey ? page : 1;
  const { sortBy, sortDir } = parseSort(sort);

  const listParams = useMemo<FetchUsersParams>(
    () => ({
      search: debouncedSearch,
      roleId,
      status,
      sortBy,
      sortDir,
      perPage,
      page: requestPage,
    }),
    [debouncedSearch, perPage, requestPage, roleId, sortBy, sortDir, status],
  );

  const usersQuery = useQuery({
    queryKey: userKeys.list(listParams),
    queryFn: () => fetchUsers(listParams),
    placeholderData: keepPreviousData,
  });

  const rolesQuery = useQuery({
    queryKey: roleKeys.all,
    queryFn: fetchRoles,
    staleTime: 5 * 60 * 1000,
  });

  const users = usersQuery.data?.users ?? [];
  const total = usersQuery.data?.meta.total ?? 0;
  const isLoading = usersQuery.isFetching;
  const errorMessage = usersQuery.isError ? getApiErrorMessage(usersQuery.error, "Could not load users.") : null;

  const columns = useMemo<TableColumn<CmsUser>[]>(
    () => [
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
        cell: (user) => <span className="text-slate-600">{formatDateTime(user.created_at)}</span>,
      },
      {
        id: "actions",
        header: "",
        cell: (user) => (
          <span className="flex items-center justify-end gap-1">
            <button
              type="button"
              aria-label={`Edit ${user.full_name}`}
              onClick={() => setEditingUser(user)}
              className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-full text-teal-700 hover:bg-teal-50"
            >
              <PencilIcon />
            </button>
            {user.id === currentUserId ? null : (
              <button
                type="button"
                aria-label={`Delete ${user.full_name}`}
                onClick={() => setDeletingUser(user)}
                className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-full text-rose-600 hover:bg-rose-50"
              >
                <TrashIcon />
              </button>
            )}
          </span>
        ),
      },
    ],
    [currentUserId],
  );

  const roleOptions = (rolesQuery.data ?? []).map((role) => ({
    value: String(role.id),
    label: role.name,
  }));

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-8">
      <section className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs text-slate-500">
            Sensus AI <span className="px-1 text-slate-300">/</span> Users
          </p>
          <h1 className="mt-1 font-brand text-2xl font-semibold text-slate-900">Users</h1>
          <p className="mt-1 text-sm text-slate-500">
            {usersQuery.data ? `${total} ${total === 1 ? "user" : "users"}` : "Accounts and assigned roles."}
          </p>
        </div>
        {canAddUser ? (
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            Add user
          </Button>
        ) : null}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Search
            <Input value={search} onChange={setSearch} placeholder="Name or email" />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Role
            <Select
              value={roleId}
              onChange={setRoleId}
              placeholder="All roles"
              options={roleOptions}
              disabled={rolesQuery.isPending}
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Status
            <Select value={status} onChange={setStatus} placeholder="All statuses" options={statusOptions} />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Sort
            <Select value={sort} onChange={setSort} options={sortOptions} />
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {errorMessage ? <p className="px-5 pt-4 text-sm text-rose-600">{errorMessage}</p> : null}
        <div className="relative min-h-40" aria-busy={isLoading}>
          <div className={isLoading ? "pointer-events-none opacity-50" : undefined}>
            <Table
              columns={columns}
              rows={users}
              getRowId={(user) => String(user.id)}
              emptyLabel={
                usersQuery.isPending ? "" : errorMessage ? "Users could not be loaded." : "No users match these filters."
              }
            />
          </div>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-teal-700" />
                Loading users
              </div>
            </div>
          ) : null}
        </div>
        <Pagination
          page={requestPage}
          pageSize={perPage}
          total={total}
          pageSizeOptions={pageSizeOptions}
          onPageChange={setPage}
          onPageSizeChange={setPerPage}
        />
      </section>

      <AddUserModal open={addOpen} onClose={() => setAddOpen(false)} />
      <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />
      <DeleteUserModal user={deletingUser} onClose={() => setDeletingUser(null)} />
    </div>
  );
}
