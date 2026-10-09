import { useController } from "react-hook-form";
import { useSchemaForm } from "@/hooks/useSchemaForm";
import { roleFormSchema, type RoleFormValues } from "./roleSchemas";
import { FormInput, FormTextarea } from "@/components/form/FormControls";
import { useGetRoleQuery, useGetGroupedPermissionsQuery, useSaveRoleMutation } from "@/redux/api/roleApi";
import { ApiErrorKind, REFERENCE_DATA_FRESH_SECONDS } from "@/redux/constants";
import { useWaitForQueryRefresh } from "@/redux/store/queryRefresh";
import { useStaleRefetch } from "@/redux/store/useStaleRefetch";
import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { usePermission } from "@/access/usePermission";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { ROUTES } from "@/constants/routes";
import type { Permission } from "./roleTypes";
import { getApiErrorMessage } from "@/utils/apiError";
import { roleCodeFromName } from "./roleCode";

const domainOrder = [
  "users",
  "roles",
  "oems",
  "microsites",
  "models",
  "specifications",
  "media",
  "offers",
  "leads",
  "bookings",
  "pages",
  "articles",
  "audit_logs",
];

const domainLabels: Record<string, string> = {
  users: "Users",
  roles: "Roles",
  oems: "OEMs",
  microsites: "Microsites",
  models: "Vehicle models",
  specifications: "Specifications",
  media: "Media",
  offers: "Offers",
  leads: "Leads",
  bookings: "Bookings",
  pages: "Pages",
  articles: "Articles",
  audit_logs: "Audit logs",
};

type EditorLocationState = {
  roleId?: number;
  permissionIds?: number[];
};

function domainLabel(domain: string) {
  return domainLabels[domain] ?? domain.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function orderedDomains(grouped: Record<string, Permission[]>) {
  const keys = Object.keys(grouped);
  return [...domainOrder.filter((key) => keys.includes(key)), ...keys.filter((key) => !domainOrder.includes(key)).sort()];
}

export default function RoleEditorPage() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const waitForRefresh = useWaitForQueryRefresh();
  const [saveRole, saveMutation] = useSaveRoleMutation();
  const [refreshing, setRefreshing] = useState(false);
  const { can } = usePermission();
  const canManage = can("roles.manage");
  const isNew = !params.roleId;
  const roleId = Number(params.roleId);
  const validId = Number.isInteger(roleId) && roleId > 0;

  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const roleQuery = useGetRoleQuery(roleId, {
    skip: isNew || !validId,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const permissionsQuery = useGetGroupedPermissionsQuery(undefined, {
    refetchOnMountOrArgChange: REFERENCE_DATA_FRESH_SECONDS,
  });
  useStaleRefetch(permissionsQuery, REFERENCE_DATA_FRESH_SECONDS);

  const restore = location.state as EditorLocationState | null;
  const role = roleQuery.currentData;

  const form = useSchemaForm(roleFormSchema(isNew ? undefined : role?.code ?? ""), {
    name: "", description: "", permissionIds: [],
  });
  const { reset, formState: { errors, isSubmitting } } = form;
  const isSaving = saveMutation.isLoading || refreshing || isSubmitting;
  const { field: permissionsField } = useController({ name: "permissionIds", control: form.control });
  const name = form.watch("name");
  const selected = permissionsField.value;
  const nameError = errors.name?.message;

  useEffect(() => {
    if (isNew && loadedKey !== "new") {
      reset({ name: "", description: "", permissionIds: [] });
      setLoadedKey("new");
    } else if (!isNew && role && loadedKey !== "role-" + role.id) {
      const restored = restore?.roleId === role.id ? restore.permissionIds : undefined;
      reset({ name: role.name, description: role.description ?? "", permissionIds: restored ?? role.permissions.map((permission) => permission.id) });
      setLoadedKey("role-" + role.id);
    }
  }, [isNew, role, restore, loadedKey, reset]);

  const locked = !isNew && (Boolean(role?.is_system) || !canManage);
  const code = isNew ? roleCodeFromName(name) : (role?.code ?? "");

  async function submitRole(values: RoleFormValues) {
    if (locked || isSaving || !permissionsQuery.isSuccess) return;
    try {
      const payload = {
        name: values.name.trim(),
        code,
        description: values.description.trim(),
      };

      const message = await saveRole({ roleId: isNew ? undefined : roleId, payload, permissionIds: values.permissionIds }).unwrap();
      setRefreshing(true);
      toast.success(message);
      await waitForRefresh();
      navigate(ROUTES.roles);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not save the role."));
      if (error && typeof error === "object" && "kind" in error && error.kind === ApiErrorKind.PermissionSync && "roleId" in error && typeof error.roleId === "number") {
        setRefreshing(true);
        await waitForRefresh();
        navigate(`${ROUTES.roles}/${error.roleId}`, {
          replace: true,
          state: { roleId: error.roleId, permissionIds: values.permissionIds } satisfies EditorLocationState,
        });
      }
    } finally {
      setRefreshing(false);
    }
  }

  function togglePermission(id: number) {
    const current = form.getValues("permissionIds");
    permissionsField.onChange(current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleGroup(ids: number[], nextChecked: boolean) {
    const current = form.getValues("permissionIds");
    const remove = new Set(ids);
    permissionsField.onChange(nextChecked ? [...new Set([...current, ...ids])] : current.filter((id) => !remove.has(id)));
  }

  if (!isNew && !validId) return <Navigate to={ROUTES.roles} replace />;
  if (isNew && !canManage) return <Navigate to={ROUTES.roles} replace />;

  if (!isNew && (roleQuery.isLoading || (!role && roleQuery.isFetching))) {
    return <StatusMessage label="Loading role" />;
  }

  if (!isNew && roleQuery.isError) {
    return (
      <div className="mx-auto w-full max-w-[1100px] space-y-4">
        <p className="text-sm text-rose-600">{getApiErrorMessage(roleQuery.error, "Could not load the role.")}</p>
        <Link to={ROUTES.roles} className="text-sm font-medium text-teal-800">
          Back to roles
        </Link>
      </div>
    );
  }

  if (!isNew && (!role || loadedKey !== `role-${role.id}`)) {
    return <StatusMessage label="Loading role" />;
  }

  const groups = permissionsQuery.data ? orderedDomains(permissionsQuery.data) : [];
  const title = isNew ? "New role" : role?.name || "Role";

  return (
    <form onSubmit={form.submitForm(submitRole)} noValidate className="mx-auto w-full max-w-[1100px] space-y-5 pb-8">
      <section className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs text-slate-500">
            Sensus AI <span className="px-1 text-slate-300">/</span>
            <Link to={ROUTES.roles} className="hover:text-slate-700">
              Roles
            </Link>
            <span className="px-1 text-slate-300">/</span>
            {isNew ? "New" : "Edit"}
          </p>
          <h1 className="mt-1 font-brand text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {locked
              ? "This role is read-only."
              : "Choose the permissions for this role. Saving replaces the full permission set."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate(ROUTES.roles)} disabled={isSaving}>
            {locked ? "Back" : "Cancel"}
          </Button>
          {locked ? null : (
            <Button variant="primary" type="submit" disabled={isSaving || !permissionsQuery.isSuccess}>
              {isSaving ? "Saving..." : isNew ? "Create role" : "Save changes"}
            </Button>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name" error={nameError || undefined}>
            <FormInput
              form={form}
              name="name"
              disabled={locked || isSaving}
              placeholder="Senior Editor"
            />
          </Field>
          <Field label="Code" hint={isNew ? "Generated from the role name." : "Code stays the same after the role is created."}>
            <Input name="code" value={code} disabled placeholder="senior_editor" onChange={() => undefined} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Description">
              <FormTextarea
                form={form}
                name="description"
                disabled={locked || isSaving}
                placeholder="What this role is allowed to do."
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Permissions</h2>
            <p className="mt-1 text-xs text-slate-500">{selected.length} selected</p>
          </div>
        </div>

        {permissionsQuery.isLoading ? <StatusMessage label="Loading permissions" /> : null}
        {permissionsQuery.isError ? (
          <p className="text-sm text-rose-600">{getApiErrorMessage(permissionsQuery.error, "Could not load permissions.")}</p>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
          {groups.map((domain) => {
            const permissions = permissionsQuery.data?.[domain] ?? [];
            return (
              <PermissionGroup
                key={domain}
                domain={domain}
                permissions={permissions}
                selected={selected}
                disabled={locked || isSaving}
                onToggle={togglePermission}
                onToggleAll={toggleGroup}
              />
            );
          })}
        </div>
      </section>
    </form>
  );
}

function PermissionGroup({
  domain,
  permissions,
  selected,
  disabled,
  onToggle,
  onToggleAll,
}: {
  domain: string;
  permissions: Permission[];
  selected: number[];
  disabled: boolean;
  onToggle: (id: number) => void;
  onToggleAll: (ids: number[], nextChecked: boolean) => void;
}) {
  const ids = permissions.map((permission) => permission.id);
  const selectedCount = ids.filter((id) => selected.includes(id)).length;
  const allChecked = ids.length > 0 && selectedCount === ids.length;

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{domainLabel(domain)}</h3>
          <p className="text-xs text-slate-500">
            {selectedCount} of {ids.length}
          </p>
        </div>
        <label className={`flex items-center gap-2 text-xs font-medium text-slate-600 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
          <input
            type="checkbox"
            className="h-4 w-4 accent-teal-700"
            checked={allChecked}
            ref={(node) => {
              if (node) node.indeterminate = selectedCount > 0 && !allChecked;
            }}
            disabled={disabled || ids.length === 0}
            onChange={() => onToggleAll(ids, !allChecked)}
          />
          Select all
        </label>
      </header>
      <ul>
        {permissions.map((permission) => (
          <li key={permission.id} className="border-t border-slate-100">
            <label className={`flex items-start gap-3 px-4 py-3 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-teal-700"
                checked={selected.includes(permission.id)}
                disabled={disabled}
                onChange={() => onToggle(permission.id)}
              />
              <span>
                <span className="block text-sm text-slate-800">{permission.name}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{permission.description}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StatusMessage({ label }: { label: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center text-sm text-slate-600">
      <span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-teal-700" />
      {label}
    </div>
  );
}
