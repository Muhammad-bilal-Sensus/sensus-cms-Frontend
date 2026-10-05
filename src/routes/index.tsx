import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import AdminLayout from "../layouts/AdminLayout";
import AuthLayout from "../layouts/AuthLayout";
import SectionPage from "../layouts/SectionPage";
import DashboardPage from "../pages/admin/dashboard/DashboardPage";
import ModelsPage from "../pages/admin/models/ModelsPage";
import { allLinks } from "../layouts/navigation";
import { ROUTES } from "../constants/routes";
import { AuthRedirect, GuestRoute, PrivateRoute } from "./guards";

const paths = [...new Set(allLinks.map((item) => item.to))];

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />
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
