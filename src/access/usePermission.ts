import { useCallback, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { hasAnyPermission, permissionCodeSet } from "./permissions";

export function usePermission() {
  const { user } = useAuth();
  const codes = useMemo(() => permissionCodeSet(user?.role?.permissions), [user]);

  const can = useCallback((code: string) => codes.has(code), [codes]);

  const canAny = useCallback((required: readonly string[]) => hasAnyPermission(codes, required), [codes]);

  return { can, canAny };
}
