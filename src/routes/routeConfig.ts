import type { RouteObject } from "react-router-dom";
import { AppRole, ROLE_NAMES } from "@/access/roles";
import { ROUTES } from "@/constants/routes";
import AuthRoutes from "@/pages/auth/AuthRoutes";
import SuperAdministratorRoutes from "@/pages/superAdministrator/SuperAdministratorRoutes";
import ContentManagerRoutes from "@/pages/contentManager/ContentManagerRoutes";
import ApproverRoutes from "@/pages/approver/ApproverRoutes";
import MarketingRoutes from "@/pages/marketing/MarketingRoutes";
import SalesRepresentativeRoutes from "@/pages/salesRepresentative/SalesRepresentativeRoutes";
import ServiceAdvisorRoutes from "@/pages/serviceAdvisor/ServiceAdvisorRoutes";
import GuestRoutes from "@/pages/guest/GuestRoutes";

export type RoleRouteConfig = {
  title: string;
  landingPage: string;
  routes: RouteObject[];
};

export const ROLE_CONFIG: Readonly<Record<AppRole, RoleRouteConfig>> = {
  [AppRole.SuperAdministrator]: { title: ROLE_NAMES[AppRole.SuperAdministrator], landingPage: ROUTES.home, routes: SuperAdministratorRoutes },
  [AppRole.ContentManager]: { title: ROLE_NAMES[AppRole.ContentManager], landingPage: ROUTES.home, routes: ContentManagerRoutes },
  [AppRole.Approver]: { title: ROLE_NAMES[AppRole.Approver], landingPage: ROUTES.home, routes: ApproverRoutes },
  [AppRole.MarketingSpecialist]: { title: ROLE_NAMES[AppRole.MarketingSpecialist], landingPage: ROUTES.home, routes: MarketingRoutes },
  [AppRole.SalesRepresentative]: { title: ROLE_NAMES[AppRole.SalesRepresentative], landingPage: ROUTES.home, routes: SalesRepresentativeRoutes },
  [AppRole.ServiceAdvisor]: { title: ROLE_NAMES[AppRole.ServiceAdvisor], landingPage: ROUTES.home, routes: ServiceAdvisorRoutes },
  [AppRole.Guest]: { title: ROLE_NAMES[AppRole.Guest], landingPage: ROUTES.home, routes: GuestRoutes },
};

export const PUBLIC_ROUTES = AuthRoutes;
