import { AppRole } from "@/access/roles";
import { useDeleteUserMutation, useGetUsersQuery } from "@/redux/api/userApi";
import { useGetRolesQuery } from "@/redux/api/roleApi";
import { REFERENCE_DATA_FRESH_SECONDS } from "@/redux/constants";
import { useWaitForQueryRefresh } from "@/redux/store/queryRefresh";
import { useStaleRefetch } from "@/redux/store/useStaleRefetch";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import AddUserModal from "./components/AddUserModal";
import Button from "@/components/ui/Button";
import ModalBox from "@/components/ui/ModalBox";
import EditUserModal from "./components/EditUserModal";
import DataTable from "@/components/ui/DataTable";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { userColumns } from "./userColumns";
import { usePermission } from "@/access/usePermission";
import { useAuth } from "@/features/auth/useAuth";
import type { FetchUsersParams } from "./userTypes";
import type { CmsUser, SortDirection, UserSortBy } from "./userTypes";
import { getApiErrorMessage } from "@/utils/apiError";

const pageSizeOptions = [10, 15, 25, 50];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

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

export default function UsersPage() {
  const { user: sessionUser } = useAuth();
  const { can } = usePermission();
  const currentUserId = sessionUser?.id;
  const isSuperAdmin = sessionUser?.role?.code === AppRole.SuperAdministrator;
  const canAddUser = can("users.create");
  const canEditUser = can("users.update");
  const canDeleteUser = can("users.delete");
  const [search, setSearch] = useState("");
  const [roleId, setRoleId] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("created_at:desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [addOpen, setAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CmsUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<CmsUser | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const waitForRefresh = useWaitForQueryRefresh();
  const [deleteUser, deleteMutation] = useDeleteUserMutation();
  const isDeleting = deleteMutation.isLoading || refreshing;
  const debouncedSearch = useDebouncedValue(search);

  async function submitDelete() {
    if (isDeleting) return;
    try {
      if (!deletingUser) throw new Error("Choose a user to delete.");
      const message = await deleteUser(deletingUser.id).unwrap();
      setRefreshing(true);
      toast.success(message);
      await waitForRefresh();
      setDeletingUser(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not delete the user."));
    } finally {
      setRefreshing(false);
    }
  }

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

  const usersQuery = useGetUsersQuery(listParams, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const rolesQuery = useGetRolesQuery(undefined, {
    refetchOnMountOrArgChange: REFERENCE_DATA_FRESH_SECONDS,
  });
  useStaleRefetch(rolesQuery, REFERENCE_DATA_FRESH_SECONDS);

  const usersResult = usersQuery.isError ? usersQuery.currentData : usersQuery.data;
  const users = usersResult?.users ?? [];
  const total = usersResult?.meta.total ?? 0;
  const isLoading = usersQuery.isFetching;
  const errorMessage = usersQuery.isError ? getApiErrorMessage(usersQuery.error, "Could not load users.") : null;

  const columns = useMemo(
    () =>
      userColumns({
        sort,
        onSort: setSort,
        canEdit: canEditUser,
        canDelete: canDeleteUser,
        currentUserId,
        isSuperAdmin,
        onEdit: setEditingUser,
        onDelete: setDeletingUser,
      }),
    [canDeleteUser, canEditUser, currentUserId, isSuperAdmin, sort],
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
            {usersResult ? `${total} ${total === 1 ? "user" : "users"}` : "Accounts and assigned roles."}
          </p>
        </div>
        {canAddUser ? (
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            Add user
          </Button>
        ) : null}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
              disabled={rolesQuery.isLoading || rolesQuery.isUninitialized}
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Status
            <Select value={status} onChange={setStatus} placeholder="All statuses" options={statusOptions} />
          </label>
        </div>
      </section>

      <DataTable
        columns={columns}
        rows={users}
        getRowId={(user) => String(user.id)}
        emptyLabel={usersQuery.isLoading ? "" : errorMessage ? "Users could not be loaded." : "No users match these filters."}
        isLoading={isLoading}
        loadingLabel="Loading users"
        errorMessage={errorMessage}
        pagination={{
          page: requestPage,
          pageSize: perPage,
          total,
          pageSizeOptions,
          onPageChange: setPage,
          onPageSizeChange: setPerPage,
        }}
      />

      <AddUserModal open={addOpen} onClose={() => setAddOpen(false)} />
      <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />
      <ModalBox
        open={Boolean(deletingUser)}
        title="Delete user"
        text={deletingUser ? `Delete ${deletingUser.full_name}?` : "Delete this user?"}
        onClose={() => setDeletingUser(null)}
        alert
        buttons={[
          { text: "Cancel", variant: "secondary", onClick: () => setDeletingUser(null), disabled: isDeleting },
          {
            text: isDeleting ? "Deleting..." : "Delete",
            variant: "primary",
            background: "#b44850",
            onClick: () => void submitDelete(),
            disabled: isDeleting,
          },
        ]}
      />
    </div>
  );
}
