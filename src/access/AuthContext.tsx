import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { authenticate, clearSession, readSession, saveSession } from "../services/authService";
import type { AuthUser } from "../types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  login: (email: string, password: string) => string | null;
  logout: () => void;
  updateProfile: (profile: AuthUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readSession());

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login(email, password) {
        const result = authenticate(email, password);
        if (!result.ok) return result.error;
        saveSession(result.user);
        setUser(result.user);
        return null;
      },
      logout() {
        clearSession();
        setUser(null);
      },
      updateProfile(profile) {
        saveSession(profile);
        setUser(profile);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
