import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/features/auth/useAuth";
import SessionScreen from "./SessionScreen";

export default function PrivateRoute() {
  const { user, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) return <SessionScreen />;
  if (!user) return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
