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

export type RolePayload = { name: string; code: string; description: string };
export type SaveRoleArgs = { roleId?: number; payload: RolePayload; permissionIds: number[] };
export type GroupedPermissions = Record<string, Permission[]>;
