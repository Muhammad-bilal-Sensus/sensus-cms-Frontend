import { AppRole } from "@/access/roles";
import { ROLE_CONFIG, type RoleRouteConfig } from "./routeConfig";

const routeRoles = Object.values(AppRole);

export function resolveAppRouteRole(code: string | null | undefined): AppRole {
  // Classify custom roles for routing without altering their backend role code,
  // ID, name, or assigned permissions.
  return routeRoles.find((role) => role === code) ?? AppRole.Guest;
}

export function getRouteConfigForRole(code: string | null | undefined): RoleRouteConfig {
  return ROLE_CONFIG[resolveAppRouteRole(code)];
}
