import { Navigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/features/auth/useAuth";
import SessionScreen from "./SessionScreen";

export default function AuthRedirect() {
  const { user, isReady } = useAuth();
  if (!isReady) return <SessionScreen />;
  return <Navigate to={user ? ROUTES.home : ROUTES.login} replace />;
}
