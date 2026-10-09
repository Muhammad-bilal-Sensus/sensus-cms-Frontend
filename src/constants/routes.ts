export const ROUTES = {
  login: "/login",
  resetPassword: "/reset-password",
  verifyOtp: "/reset-password/verify",
  setPassword: "/reset-password/new",
  home: "/dashboard",
  models: "/models",
  offers: "/offers",
  testDrive: "/test-drive",
  bookService: "/book-service",
  evTechnology: "/ev-technology",
  owners: "/owners",
  news: "/news",
  contact: "/contact",
  leads: "/leads",
  branches: "/branches",
  media: "/media",
  approvals: "/approvals",
  audit: "/audit",
  users: "/settings/users",
  roles: "/settings/roles",
  roleNew: "/settings/roles/new",
  roleDetail: "/settings/roles/:roleId",
  seo: "/settings/seo",
} as const;

const guestPaths = new Set<string>([ROUTES.login, ROUTES.resetPassword, ROUTES.verifyOtp, ROUTES.setPassword]);

export function pathAfterLogin(from: string | null | undefined) {
  if (from && from.startsWith("/") && !guestPaths.has(from)) {
    return from;
  }
  return ROUTES.home;
}
