import type { ComponentType } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import DashboardPage from "@/features/dashboard/DashboardPage";
import ModelsPage from "@/features/models/ModelsPage";
import RolesPage from "@/features/roles/RolesPage";
import RoleEditorPage from "@/features/roles/RoleEditorPage";
import UsersPage from "@/features/users/UsersPage";
import AdminLayout from "@/layouts/AdminLayout";
import SectionPage from "@/layouts/SectionPage";
import { allLinks } from "@/layouts/navigation";
import RequireAccess from "@/routes/RequireAccess";
import OemsPage from "@/features/oems/OemsPage";

export type CmsRouteDefinition = {
  path: string;
  Component: ComponentType;
  permissions?: readonly string[];
};

const featurePages: Readonly<Partial<Record<string, ComponentType>>> = {
  [ROUTES.home]: DashboardPage,
  [ROUTES.oems]: OemsPage,
  [ROUTES.models]: ModelsPage,
  [ROUTES.users]: UsersPage,
  [ROUTES.roles]: RolesPage,
};

export const CMS_ROUTE_DEFINITIONS: readonly CmsRouteDefinition[] = [
  { path: ROUTES.roleNew, Component: RoleEditorPage, permissions: ["roles.manage"] },
  { path: ROUTES.roleDetail, Component: RoleEditorPage, permissions: ["roles.view"] },
  ...allLinks.map((item) => ({
    path: item.to,
    Component: featurePages[item.to] ?? SectionPage,
    permissions: item.permissions,
  })),
];

// Role groups share the existing pages and permission checks. Per-role route
// differences can be added here once their access requirements are defined.
export function createCmsRoutes(definitions: readonly CmsRouteDefinition[] = CMS_ROUTE_DEFINITIONS): RouteObject[] {
  return [
    {
      element: <AdminLayout />,
      children: [
        { index: true, element: <Navigate to={ROUTES.home} replace /> },
        ...definitions.map(({ path, Component, permissions }) => ({
          path: path.slice(1),
          element: <RequireAccess permissions={permissions}><Component /></RequireAccess>,
        })),
      ],
    },
  ];
}
