import type { ApiEnvelope } from "../types/api";
import { api } from "./api";

export type Permission = {
  id: number;
  name: string;
  code: string;
  description: string;
};

export type CmsRole = {
  id: number;
  name: string;
  code: string;
  description: string;
  is_system: boolean;
  permissions: Permission[];
};

export type RolePayload = {
  name: string;
  code: string;
  description: string;
};

export type GroupedPermissions = Record<string, Permission[]>;

export class PermissionSyncError extends Error {
  readonly roleId: number;

  constructor(roleId: number, message: string) {
    super(message);
    this.name = "PermissionSyncError";
    this.roleId = roleId;
  }
}

export const roleKeys = {
  all: ["roles"] as const,
  detail: (id: number) => ["roles", "detail", id] as const,
};

export const permissionKeys = {
  grouped: ["permissions", "grouped"] as const,
};

function normalizeRole(role: CmsRole): CmsRole {
  return {
    ...role,
    description: role.description ?? "",
    permissions: Array.isArray(role.permissions) ? role.permissions : [],
  };
}

export async function fetchRoles(): Promise<CmsRole[]> {
  const { data } = await api.get<ApiEnvelope<CmsRole[]>>("/api/cms/v1/roles");

  if (!data.success || !Array.isArray(data.data)) {
    throw new Error(data.message || "Could not load roles.");
  }

  return data.data.map(normalizeRole);
}

export async function fetchRole(id: number): Promise<CmsRole> {
  const { data } = await api.get<ApiEnvelope<CmsRole>>(`/api/cms/v1/roles/${id}`);

  if (!data.success || !data.data?.id) {
    throw new Error(data.message || "Could not load the role.");
  }

  return normalizeRole(data.data);
}

export async function fetchGroupedPermissions(): Promise<GroupedPermissions> {
  const { data } = await api.get<ApiEnvelope<GroupedPermissions>>("/api/cms/v1/permissions", {
    params: { grouped: true },
  });

  if (!data.success || !data.data || Array.isArray(data.data)) {
    throw new Error(data.message || "Could not load permissions.");
  }

  const grouped: GroupedPermissions = {};
  for (const [domain, permissions] of Object.entries(data.data)) {
    if (Array.isArray(permissions)) grouped[domain] = permissions;
  }
  return grouped;
}

export async function createRole(payload: RolePayload) {
  const { data } = await api.post<ApiEnvelope<CmsRole>>("/api/cms/v1/roles", payload);

  if (!data.success || !data.data?.id) {
    throw new Error(data.message || "Could not create the role.");
  }

  return {
    role: normalizeRole(data.data),
    message: data.message?.trim() || "Role created.",
  };
}

export async function updateRole(id: number, payload: RolePayload) {
  const { data } = await api.put<ApiEnvelope<CmsRole>>(`/api/cms/v1/roles/${id}`, payload);

  if (!data.success) {
    throw new Error(data.message || "Could not update the role.");
  }

  return {
    role: data.data ? normalizeRole(data.data) : null,
    message: data.message?.trim() || "Role updated.",
  };
}

export async function syncRolePermissions(id: number, permissionIds: number[]) {
  const { data } = await api.put<ApiEnvelope<CmsRole>>(`/api/cms/v1/roles/${id}/permissions`, {
    permission_ids: permissionIds,
  });

  if (!data.success) {
    throw new Error(data.message || "Could not save permissions.");
  }

  return {
    role: data.data ? normalizeRole(data.data) : null,
    message: data.message?.trim() || "Permissions saved.",
  };
}

export async function deleteRole(id: number) {
  const { data } = await api.delete<{ success?: boolean; message?: string }>(`/api/cms/v1/roles/${id}`);

  if (!data?.success) {
    throw new Error(data?.message || "Could not delete the role.");
  }

  return data.message?.trim() || "Role deleted.";
}
