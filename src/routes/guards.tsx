import { Navigate, Outlet, useLocation } from "react-router-dom";
import { pathAfterLogin, ROUTES } from "../constants/routes";
import { useAuth } from "../hooks/useAuth";

function SessionScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-white text-slate-600">
      <div className="flex items-center gap-3 text-sm">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
        Loading your session
      </div>
    </div>
  );
}

export function PrivateRoute() {
  const { user, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) return <SessionScreen />;

  if (!user) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { user, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) return <SessionScreen />;

  if (user) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={pathAfterLogin(from)} replace />;
  }

  return <Outlet />;
}

export function AuthRedirect() {
  const { user, isReady } = useAuth();
  if (!isReady) return <SessionScreen />;
  return <Navigate to={user ? ROUTES.home : ROUTES.login} replace />;
}
