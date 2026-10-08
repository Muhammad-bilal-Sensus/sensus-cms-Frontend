import type { ApiEnvelope } from "../types/api";
import type { RoleOption } from "../types/user";
import { api } from "./api";

export const roleKeys = {
  all: ["roles"] as const,
};

export async function fetchRoles(): Promise<RoleOption[]> {
  const { data } = await api.get<ApiEnvelope<RoleOption[]>>("/api/cms/v1/roles");

  if (!data.success || !Array.isArray(data.data)) {
    throw new Error(data.message || "Could not load roles.");
  }

  return data.data.map((role) => ({ id: role.id, name: role.name }));
}
