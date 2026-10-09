import { Navigate, Outlet, useLocation } from "react-router-dom";
import { pathAfterLogin } from "@/constants/routes";
import { useAuth } from "@/features/auth/useAuth";
import SessionScreen from "./SessionScreen";

// Public auth pages are for signed-out visitors. AppRole.Guest is a separate,
// authenticated route category for custom roles.
export default function PublicRoute() {
  const { user, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) return <SessionScreen />;
  if (user) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={pathAfterLogin(from)} replace />;
  }
  return <Outlet />;
}
