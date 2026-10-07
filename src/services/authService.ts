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

type MessageEnvelope = {
  success?: boolean;
  message?: string;
};

async function postAuthMessage(url: string, body: unknown, fallback: string) {
  const { data } = await api.post<MessageEnvelope>(url, body);
  const message = data?.message?.trim();
  if (!data?.success) {
    throw new Error(message || fallback);
  }
  return message || fallback;
}

export function forgotPasswordRequest(email: string) {
  return postAuthMessage("/api/cms/v1/forgot-password", { email: email.trim() }, "Could not send the code.");
}

export function verifyOtpRequest(email: string, otp: string) {
  return postAuthMessage("/api/cms/v1/verify-otp", { email: email.trim(), otp }, "Could not verify the code.");
}

export function resetPasswordRequest(payload: {
  email: string;
  otp: string;
  password: string;
  password_confirmation: string;
}) {
  return postAuthMessage(
    "/api/cms/v1/reset-password",
    {
      email: payload.email.trim(),
      otp: payload.otp,
      password: payload.password,
      password_confirmation: payload.password_confirmation,
    },
    "Could not reset the password.",
  );
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
