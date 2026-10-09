import { authApi, useGetMeQuery, useLoginMutation, useLogoutMutation } from "@/redux/api/authApi";
import { cmsApi } from "@/redux/api/baseApi";
import { REFERENCE_DATA_FRESH_SECONDS } from "@/redux/constants";
import { useAppDispatch } from "@/redux/store/hooks";
import { useStaleRefetch } from "@/redux/store/useStaleRefetch";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setUnauthorizedHandler } from "@/redux/store/baseQuery";
import { toAuthUser } from "./authMapper";
import { clearAuth, getAccessToken, readSession, saveAuth, saveSession } from "@/services/authStorage";
import type { ApiUser, AuthUser } from "./authTypes";

type AuthContextValue = {
  user: AuthUser | null;
  isReady: boolean;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  login: (email: string, password: string) => Promise<string>;
  logout: () => Promise<string>;
  updateProfile: (profile: AuthUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const [requestLogin, { reset: resetLogin }] = useLoginMutation();
  const [requestLogout, { reset: resetLogout }] = useLogoutMutation();
  const [token, setToken] = useState<string | null>(() => getAccessToken());
  const [user, setUser] = useState<AuthUser | null>(() => readSession());
  const [bootSettled, setBootSettled] = useState(() => !getAccessToken());
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const meQuery = useGetMeQuery(undefined, {
    skip: !token,
    refetchOnMountOrArgChange: REFERENCE_DATA_FRESH_SECONDS,
    refetchOnFocus: false,
  });
  useStaleRefetch(meQuery, REFERENCE_DATA_FRESH_SECONDS, { onFocus: false });

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
    dispatch(cmsApi.util.resetApiState());
  }, [dispatch]);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      const message = await requestLogout().unwrap();
      clearSession();
      return message;
    } catch (error) {
      if (!getAccessToken()) {
        clearSession();
        return "Logged out.";
      }
      throw error;
    } finally {
      setIsLoggingOut(false);
      resetLogout();
    }
  }, [clearSession, requestLogout, resetLogout]);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

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
      setIsLoggingIn(true);
      try {
        const previous = readSession();
        const result = await requestLogin({ email, password }).unwrap();
        const tokenType = result.token_type || "Bearer";
        const localProfile = previous?.id === result.user.id ? previous : null;
        // Cached private data belongs to the previous authenticated session.
        dispatch(cmsApi.util.resetApiState());
        saveAuth(result.token, toAuthUser(result.user, localProfile), tokenType);
        setToken(result.token);

        try {
          const apiUser = await dispatch(authApi.endpoints.getMe.initiate(undefined, {
            subscribe: false,
            forceRefetch: true,
          })).unwrap();
          const next = toAuthUser(apiUser, localProfile);
          saveAuth(result.token, next, tokenType);
          setUser(next);
          return result.message;
        } catch (error) {
          clearSession();
          throw error;
        }
      } finally {
        setIsLoggingIn(false);
        resetLogin();
      }
    },
    [dispatch, requestLogin, resetLogin, clearSession],
  );

  const updateProfile = useCallback((profile: AuthUser) => {
    saveSession(profile);
    setUser(profile);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady: bootSettled,
      isLoggingIn,
      isLoggingOut,
      login,
      logout,
      updateProfile,
    }),
    [user, bootSettled, isLoggingIn, isLoggingOut, login, logout, updateProfile],
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
