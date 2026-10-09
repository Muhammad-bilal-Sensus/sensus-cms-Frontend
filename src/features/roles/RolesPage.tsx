import { useGetRolesQuery } from "@/redux/api/roleApi";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePermission } from "@/access/usePermission";
import Button from "@/components/ui/Button";
import DeleteRoleModal from "./components/DeleteRoleModal";
import Input from "@/components/ui/Input";
import Table, { type TableColumn } from "@/components/ui/Table";
import { ROUTES } from "@/constants/routes";
import { PencilIcon, TrashIcon } from "@/components/icons/Icon";
import type { CmsRole } from "./roleTypes";
import { getApiErrorMessage } from "@/utils/apiError";

export default function RolesPage() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const canManage = can("roles.manage");
  const [search, setSearch] = useState("");
  const [deletingRole, setDeletingRole] = useState<CmsRole | null>(null);

  const rolesQuery = useGetRolesQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const roles = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const list = rolesQuery.data ?? [];
    if (!needle) return list;
    return list.filter((role) => {
      const haystack = `${role.name} ${role.code} ${role.description}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [rolesQuery.data, search]);

  const columns = useMemo<TableColumn<CmsRole>[]>(
    () => [
      {
        id: "name",
        header: "Role",
        cell: (role) => (
          <button type="button" onClick={() => navigate(`${ROUTES.roles}/${role.id}`)} className="cursor-pointer text-left font-medium text-slate-900 hover:text-teal-800">
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
              onClick={() => navigate(`${ROUTES.roles}/${role.id}`)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-teal-700 hover:bg-teal-50"
            >
              <PencilIcon />
            </button>
            {canManage && !role.is_system ? (
              <button
                type="button"
                aria-label={`Delete ${role.name}`}
                onClick={() => setDeletingRole(role)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-rose-600 hover:bg-rose-50"
              >
                <TrashIcon />
              </button>
            ) : null}
          </span>
        ),
      },
    ],
    [canManage, navigate],
  );

  const errorMessage = rolesQuery.isError ? getApiErrorMessage(rolesQuery.error, "Could not load roles.") : null;
  const isLoading = rolesQuery.isLoading;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-8">
      <section className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs text-slate-500">
            Sensus AI <span className="px-1 text-slate-300">/</span> Roles
          </p>
          <h1 className="mt-1 font-brand text-2xl font-semibold text-slate-900">Roles</h1>
          <p className="mt-1 text-sm text-slate-500">
            {rolesQuery.data ? `${rolesQuery.data.length} ${rolesQuery.data.length === 1 ? "role" : "roles"}` : "Roles and the permissions assigned to them."}
          </p>
        </div>
        {canManage ? (
          <Button variant="primary" onClick={() => navigate(ROUTES.roleNew)}>
            Add role
          </Button>
        ) : null}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label className="grid max-w-sm gap-1 text-xs font-medium text-slate-600">
          Search
          <Input value={search} onChange={setSearch} placeholder="Name, code, or description" />
        </label>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {errorMessage ? <p className="px-5 pt-4 text-sm text-rose-600">{errorMessage}</p> : null}
        <div className="relative min-h-40" aria-busy={isLoading}>
          <div className={isLoading ? "pointer-events-none opacity-50" : undefined}>
            <Table
              columns={columns}
              rows={roles}
              getRowId={(role) => String(role.id)}
              emptyLabel={rolesQuery.isLoading ? "" : errorMessage ? "Roles could not be loaded." : "No roles match this search."}
            />
          </div>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-teal-700" />
                Loading roles
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <DeleteRoleModal role={deletingRole} onClose={() => setDeletingRole(null)} />
    </div>
  );
}
