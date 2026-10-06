import type { ApiEnvelope } from "../types/api";
import type { ApiUser, AuthUser, LoginData } from "../types/auth";
import { api } from "./api";

export const authKeys = {
  me: ["auth", "me"] as const,
};

export type LoginPayload = {
  email: string;
  password: string;
};

export function toAuthUser(apiUser: ApiUser, previous?: AuthUser | null): AuthUser {
  const sameUser = previous?.id === apiUser.id;
  return {
    ...apiUser,
    picture: sameUser ? previous?.picture : undefined,
    city: sameUser ? previous?.city : undefined,
    timeZone: sameUser ? previous?.timeZone : undefined,
    language: sameUser ? previous?.language : undefined,
  };
}

export async function loginRequest(payload: LoginPayload) {
  const { data } = await api.post<ApiEnvelope<LoginData>>("/api/cms/v1/login", {
    email: payload.email.trim(),
    password: payload.password,
  });

  if (!data.success || !data.data?.token || !data.data.user) {
    throw new Error(data.message || "Login failed.");
  }

  return {
    ...data.data,
    message: data.message.trim() || "Login successful.",
  };
}

export async function logoutRequest() {
  const { data } = await api.post<ApiEnvelope<unknown>>("/api/cms/v1/logout");

  if (!data?.success) {
    throw new Error(data?.message || "Logout failed.");
  }

  return data.message?.trim() || "Logged out.";
}

export async function fetchMe() {
  const { data } = await api.get<ApiEnvelope<ApiUser>>("/api/cms/v1/me");

  if (!data.success || !data.data?.email) {
    throw new Error(data.message || "Could not load your profile.");
  }

  return data.data;
}
