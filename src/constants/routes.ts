export const ROUTES = {
  login: "/login",
  resetPassword: "/reset-password",
  home: "/dashboard",
  models: "/models",
} as const;

export function pathAfterLogin(from: string | null | undefined) {
  if (from && from.startsWith("/") && from !== ROUTES.login && from !== ROUTES.resetPassword) {
    return from;
  }
  return ROUTES.home;
}
