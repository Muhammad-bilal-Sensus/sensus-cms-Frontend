import { useDeleteRoleMutation, useGetRolesQuery } from "@/redux/api/roleApi";
import { useWaitForQueryRefresh } from "@/redux/store/queryRefresh";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { usePermission } from "@/access/usePermission";
import Button from "@/components/ui/Button";
import ModalBox from "@/components/ui/ModalBox";
import Input from "@/components/ui/Input";
import DataTable from "@/components/ui/DataTable";
import { ROUTES } from "@/constants/routes";
import { roleColumns } from "./roleColumns";
import type { CmsRole } from "./roleTypes";
import { getApiErrorMessage } from "@/utils/apiError";

export default function RolesPage() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const canManage = can("roles.manage");
  const [search, setSearch] = useState("");
  const [deletingRole, setDeletingRole] = useState<CmsRole | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const waitForRefresh = useWaitForQueryRefresh();
  const [deleteRole, deleteMutation] = useDeleteRoleMutation();
  const isDeleting = deleteMutation.isLoading || refreshing;

  async function submitDelete() {
    if (isDeleting) return;
    try {
      if (!deletingRole) throw new Error("Choose a role to delete.");
      const message = await deleteRole(deletingRole.id).unwrap();
      setRefreshing(true);
      toast.success(message);
      await waitForRefresh();
      setDeletingRole(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not delete the role."));
    } finally {
      setRefreshing(false);
    }
  }

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

  const columns = useMemo(
    () =>
      roleColumns({
        canManage,
        onOpen: (role) => navigate(`${ROUTES.roles}/${role.id}`),
        onDelete: setDeletingRole,
      }),
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

      <DataTable
        columns={columns}
        rows={roles}
        getRowId={(role) => String(role.id)}
        emptyLabel={rolesQuery.isLoading ? "" : errorMessage ? "Roles could not be loaded." : "No roles match this search."}
        isLoading={isLoading}
        loadingLabel="Loading roles"
        errorMessage={errorMessage}
      />

      <ModalBox
        open={Boolean(deletingRole)}
        title="Delete role"
        text={deletingRole ? `Delete ${deletingRole.name}?` : "Delete this role?"}
        onClose={() => setDeletingRole(null)}
        alert
        buttons={[
          { text: "Cancel", variant: "secondary", onClick: () => setDeletingRole(null), disabled: isDeleting },
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
