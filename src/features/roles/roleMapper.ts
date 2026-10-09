import type { CmsRole, GroupedPermissions } from "./roleTypes";

export function normalizeRole(role: CmsRole): CmsRole {
  return {
    ...role,
    description: role.description ?? "",
    permissions: Array.isArray(role.permissions) ? role.permissions : [],
  };
}

export function normalizeGroupedPermissions(data: GroupedPermissions): GroupedPermissions {
  const grouped: GroupedPermissions = {};
  for (const [domain, permissions] of Object.entries(data)) {
    if (Array.isArray(permissions)) grouped[domain] = permissions;
  }
  return grouped;
}
