import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { usePermission } from "@/access/usePermission";
import { ROUTES } from "@/constants/routes";

export default function RequireAccess({ permissions, children }: { permissions?: readonly string[]; children: ReactNode }) {
  const { canAny } = usePermission();
  if (!canAny(permissions ?? [])) return <Navigate to={ROUTES.home} replace />;
  return children;
}
