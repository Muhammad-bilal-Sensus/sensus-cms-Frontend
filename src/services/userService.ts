import type { ApiEnvelope } from "../types/api";
import type { CmsUser, PageMeta, SortDirection, UserSortBy, UserStatus } from "../types/user";
import { api } from "./api";

export type FetchUsersParams = {
  search?: string;
  roleId?: string;
  status?: string;
  sortBy: UserSortBy;
  sortDir: SortDirection;
  perPage: number;
  page: number;
};

export type UsersListResult = {
  users: CmsUser[];
  meta: PageMeta;
};

type UsersResponse = ApiEnvelope<CmsUser[]> & {
  meta?: PageMeta;
};

export const userKeys = {
  all: ["users"] as const,
  list: (params: FetchUsersParams) => ["users", params] as const,
};

export type CreateUserPayload = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role_id: number;
  status: UserStatus;
};

export async function fetchUsers(params: FetchUsersParams): Promise<UsersListResult> {
  const query: Record<string, string | number> = {
    sort_by: params.sortBy,
    sort_dir: params.sortDir,
    per_page: params.perPage,
    page: params.page,
  };

  const search = params.search?.trim();
  if (search) query.search = search;
  if (params.roleId) query.role_id = Number(params.roleId);
  if (params.status) query.status = params.status;

  const { data } = await api.get<UsersResponse>("/api/cms/v1/users", { params: query });

  if (!data.success || !Array.isArray(data.data) || !data.meta) {
    throw new Error(data.message || "Could not load users.");
  }

  return { users: data.data, meta: data.meta };
}

export async function createUser(payload: CreateUserPayload) {
  const { data } = await api.post<ApiEnvelope<CmsUser>>("/api/cms/v1/users", payload);

  if (!data.success) {
    throw new Error(data.message || "Could not create the user.");
  }

  return {
    user: data.data,
    message: data.message?.trim() || "User created.",
  };
}

export type UpdateUserPayload = {
  first_name: string;
  last_name: string;
  email: string;
  status: UserStatus;
  role_id: number;
  password: string;
  password_confirmation: string;
};

export async function updateUser(id: number, payload: UpdateUserPayload) {
  const { data } = await api.put<ApiEnvelope<CmsUser>>(`/api/cms/v1/users/${id}`, payload);

  if (!data.success) {
    throw new Error(data.message || "Could not update the user.");
  }

  return {
    user: data.data,
    message: data.message?.trim() || "User updated.",
  };
}

export async function deleteUser(id: number) {
  const { data } = await api.delete<{ success?: boolean; message?: string }>(`/api/cms/v1/users/${id}`);

  if (!data?.success) {
    throw new Error(data?.message || "Could not delete the user.");
  }

  return data.message?.trim() || "User deleted.";
}
