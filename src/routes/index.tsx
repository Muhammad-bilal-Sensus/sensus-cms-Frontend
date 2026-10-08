import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import AdminLayout from "../layouts/AdminLayout";
import AuthLayout from "../layouts/AuthLayout";
import SectionPage from "../layouts/SectionPage";
import DashboardPage from "../pages/admin/dashboard/DashboardPage";
import ModelsPage from "../pages/admin/models/ModelsPage";
import RoleEditorPage from "../pages/admin/settings/RoleEditorPage";
import RolesPage from "../pages/admin/settings/RolesPage";
import UsersPage from "../pages/admin/settings/UsersPage";
import { allLinks } from "../layouts/navigation";
import { ROUTES } from "../constants/routes";
import { AuthRedirect, GuestRoute, PrivateRoute, RequireAccess } from "./guards";
import VerifyOtpPage from "@/pages/auth/VerifyOtpPage";
import SetPasswordPage from "@/pages/auth/SetPasswordPage";

function pageFor(path: string) {
  if (path === ROUTES.home) return <DashboardPage />;
  if (path === ROUTES.models) return <ModelsPage />;
  if (path === ROUTES.users) return <UsersPage />;
  if (path === ROUTES.roles) return <RolesPage />;
  return <SectionPage />;
}

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
          <Route
            path={ROUTES.roleNew.slice(1)}
            element={
              <RequireAccess permissions={["roles.manage"]}>
                <RoleEditorPage />
              </RequireAccess>
            }
          />
          <Route
            path="settings/roles/:roleId"
            element={
              <RequireAccess permissions={["roles.view"]}>
                <RoleEditorPage />
              </RequireAccess>
            }
          />
          {allLinks.map((item) => (
            <Route
              key={item.to}
              path={item.to.slice(1)}
              element={<RequireAccess permissions={item.permissions}>{pageFor(item.to)}</RequireAccess>}
            />
          ))}
        </Route>
      </Route>

      <Route path="*" element={<AuthRedirect />} />
    </Routes>
  );
}
