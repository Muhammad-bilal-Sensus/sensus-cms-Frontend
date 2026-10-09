import type { AuthUser } from "@/features/auth/authTypes";

const STORAGE_KEY = "cms.auth";
const LEGACY_KEY = "albisher.session";

type PersistedAuth = {
  token: string;
  tokenType: string;
  user: AuthUser;
};

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") return false;
  const user = value as Partial<AuthUser>;
  return typeof user.id === "number" && typeof user.email === "string" && user.email.length > 0 && typeof user.full_name === "string";
}

function readPersisted(): PersistedAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<PersistedAuth>;
    if (typeof data.token !== "string" || !data.token || !isAuthUser(data.user)) return null;
    return {
      token: data.token,
      tokenType: typeof data.tokenType === "string" && data.tokenType ? data.tokenType : "Bearer",
      user: data.user,
    };
  } catch {
    return null;
  }
}

export function getAccessToken() {
  return readPersisted()?.token ?? null;
}

export function getTokenType() {
  return readPersisted()?.tokenType ?? "Bearer";
}

export function readSession(): AuthUser | null {
  return readPersisted()?.user ?? null;
}

export function saveAuth(token: string, user: AuthUser, tokenType = "Bearer") {
  const payload: PersistedAuth = { token, tokenType, user };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  localStorage.removeItem(LEGACY_KEY);
}

export function saveSession(user: AuthUser) {
  const current = readPersisted();
  if (!current) return;
  saveAuth(current.token, user, current.tokenType);
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_KEY);
}
