import { useRoutes, type RouteObject } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import AuthRedirect from "./AuthRedirect";
import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";
import { PUBLIC_ROUTES } from "./routeConfig";
import { getRouteConfigForRole } from "./roleRouteTargets";

export function getAppRoutes(roleCode?: string | null): RouteObject[] {
  const roleRoutes = getRouteConfigForRole(roleCode).routes;
  return [
    { element: <PublicRoute />, children: PUBLIC_ROUTES },
    { element: <PrivateRoute />, children: roleRoutes },
    { path: "*", element: <AuthRedirect /> },
  ];
}

export default function AppRoutes() {
  const { user } = useAuth();
  return useRoutes(getAppRoutes(user?.role?.code));
}
