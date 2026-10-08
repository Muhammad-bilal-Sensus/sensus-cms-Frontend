export type UserStatus = "active" | "inactive" | "suspended";

export type UserSortBy = "created_at" | "first_name" | "email";

export type SortDirection = "asc" | "desc";

export type CmsUserRole = {
  id: number;
  name: string;
  code: string;
  description: string;
  is_system: boolean;
};

export type UserAuditActor = {
  id: number;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
} | null;

export type CmsUser = {
  id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  role: CmsUserRole | null;
  created_by: UserAuditActor;
  updated_by: UserAuditActor;
  last_login_at: string | null;
  created_at: string;
  updated_at: string | null;
};

export type PageMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type RoleOption = {
  id: number;
  name: string;
};
