const STORAGE_KEY = "sensus.passwordReset";

export type PasswordResetDraft = {
  email: string;
  otp?: string;
};

export function readPasswordResetDraft(): PasswordResetDraft | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PasswordResetDraft;
    if (!parsed?.email?.trim()) return null;
    return {
      email: parsed.email.trim(),
      otp: parsed.otp,
    };
  } catch {
    return null;
  }
}

export function savePasswordResetDraft(draft: PasswordResetDraft) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function clearPasswordResetDraft() {
  sessionStorage.removeItem(STORAGE_KEY);
}
