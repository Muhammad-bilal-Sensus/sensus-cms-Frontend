import type { AuthUser } from "../types/auth";

const STORAGE_KEY = "albisher.session";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function readSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<AuthUser>;
    if (typeof data.email !== "string" || typeof data.name !== "string" || !data.email) return null;
    return {
      email: data.email,
      name: data.name,
      picture: typeof data.picture === "string" ? data.picture : undefined,
      city: typeof data.city === "string" ? data.city : undefined,
      timeZone: typeof data.timeZone === "string" ? data.timeZone : undefined,
      language: typeof data.language === "string" ? data.language : undefined,
    };
  } catch {
    return null;
  }
}

export function saveSession(user: AuthUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function authenticate(
  email: string,
  password: string,
): { ok: true; user: AuthUser } | { ok: false; error: string } {
  const normalized = email.trim().toLowerCase();
  if (!emailPattern.test(normalized)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (!password.trim()) {
    return { ok: false, error: "Enter your password." };
  }

  const name = normalized.split("@")[0] || normalized;
  return { ok: true, user: { email: normalized, name } };
}
