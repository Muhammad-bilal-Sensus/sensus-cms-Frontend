import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setUnauthorizedHandler } from "../services/api";
import { authKeys, fetchMe, loginRequest, logoutRequest, toAuthUser } from "../services/authService";
import { clearAuth, getAccessToken, readSession, saveAuth, saveSession } from "../services/authStorage";
import type { ApiUser, AuthUser } from "../types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<string>;
  logout: () => Promise<string>;
  updateProfile: (profile: AuthUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => getAccessToken());
  const [user, setUser] = useState<AuthUser | null>(() => readSession());
  const [bootSettled, setBootSettled] = useState(() => !getAccessToken());

  const meQuery = useQuery({
    queryKey: authKeys.me,
    queryFn: fetchMe,
    enabled: Boolean(token),
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const syncServerUser = useCallback((apiUser: ApiUser) => {
    const current = readSession();
    const next = toAuthUser(apiUser, current?.id === apiUser.id ? current : null);
    const currentToken = getAccessToken();
    if (currentToken) saveAuth(currentToken, next);
    setUser(next);
    return next;
  }, []);

  const clearSession = useCallback(() => {
    clearAuth();
    setToken(null);
    setUser(null);
    queryClient.removeQueries({ queryKey: authKeys.me });
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      const message = await logoutRequest();
      clearSession();
      return message;
    } catch (error) {
      if (!getAccessToken()) {
        clearSession();
        return "Logged out.";
      }
      throw error;
    }
  }, [clearSession]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearAuth();
      setToken(null);
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setBootSettled(true);
      return;
    }

    if (meQuery.isSuccess && meQuery.data) {
      syncServerUser(meQuery.data);
      setBootSettled(true);
      return;
    }

    if (meQuery.isError) {
      setBootSettled(true);
    }
  }, [token, meQuery.isSuccess, meQuery.isError, meQuery.data, syncServerUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const previous = readSession();
      const result = await loginRequest({ email, password });
      const tokenType = result.token_type || "Bearer";
      const localProfile = previous?.id === result.user.id ? previous : null;
      saveAuth(result.token, toAuthUser(result.user, localProfile), tokenType);
      setToken(result.token);

      try {
        const apiUser = await queryClient.fetchQuery({
          queryKey: authKeys.me,
          queryFn: fetchMe,
          retry: false,
          staleTime: 0,
        });
        const next = toAuthUser(apiUser, localProfile);
        saveAuth(result.token, next, tokenType);
        setUser(next);
        return result.message;
      } catch (error) {
        clearAuth();
        setToken(null);
        setUser(null);
        queryClient.removeQueries({ queryKey: authKeys.me });
        throw error;
      }
    },
    [queryClient],
  );

  const updateProfile = useCallback((profile: AuthUser) => {
    saveSession(profile);
    setUser(profile);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady: bootSettled,
      login,
      logout,
      updateProfile,
    }),
    [user, bootSettled, login, logout, updateProfile],
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
