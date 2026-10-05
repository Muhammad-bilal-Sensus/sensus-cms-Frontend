import { Navigate, Outlet, useLocation } from "react-router-dom";
import { pathAfterLogin, ROUTES } from "../constants/routes";
import { useAuth } from "../hooks/useAuth";

export function PrivateRoute() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { user } = useAuth();
  const location = useLocation();

  if (user) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={pathAfterLogin(from)} replace />;
  }

  return <Outlet />;
}

export function AuthRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? ROUTES.home : ROUTES.login} replace />;
}
