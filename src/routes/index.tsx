import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import AdminLayout from "../layouts/AdminLayout";
import AuthLayout from "../layouts/AuthLayout";
import SectionPage from "../layouts/SectionPage";
import DashboardPage from "../pages/admin/dashboard/DashboardPage";
import ModelsPage from "../pages/admin/models/ModelsPage";
import UsersPage from "../pages/admin/settings/UsersPage";
import { allLinks } from "../layouts/navigation";
import { ROUTES } from "../constants/routes";
import { AuthRedirect, GuestRoute, PrivateRoute } from "./guards";
import VerifyOtpPage from "@/pages/auth/VerifyOtpPage";
import SetPasswordPage from "@/pages/auth/SetPasswordPage";

const paths = [...new Set(allLinks.map((item) => item.to))];

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />
          <Route path={ROUTES.verifyOtp} element={<VerifyOtpPage />} />
          <Route path={ROUTES.setPassword} element={<SetPasswordPage />} />
        </Route>
      </Route>

      <Route element={<PrivateRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to={ROUTES.home} replace />} />
          {paths.map((path) => (
            <Route
              key={path}
              path={path.slice(1)}
              element={
                path === ROUTES.home ? (
                  <DashboardPage />
                ) : path === ROUTES.models ? (
                  <ModelsPage />
                ) : path === ROUTES.users ? (
                  <UsersPage />
                ) : (
                  <SectionPage />
                )
              }
            />
          ))}
        </Route>
      </Route>

      <Route path="*" element={<AuthRedirect />} />
    </Routes>
  );
}
