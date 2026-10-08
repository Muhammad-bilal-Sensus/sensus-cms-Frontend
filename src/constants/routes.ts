export const ROUTES = {
  login: "/login",
  resetPassword: "/reset-password",
  verifyOtp: "/reset-password/verify",
  setPassword: "/reset-password/new",
  home: "/dashboard",
  models: "/models",
  users: "/settings/users",
  roles: "/settings/roles",
  roleNew: "/settings/roles/new",
} as const;

const guestPaths = new Set<string>([ROUTES.login, ROUTES.resetPassword, ROUTES.verifyOtp, ROUTES.setPassword]);

export function pathAfterLogin(from: string | null | undefined) {
  if (from && from.startsWith("/") && !guestPaths.has(from)) {
    return from;
  }
  return ROUTES.home;
}
