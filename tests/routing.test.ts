import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@/features/auth/authTypes";
import AppRoutes from "@/routes/AppRoutes";
import { AppRole } from "@/access/roles";
import { resolveAppRouteRole } from "@/routes/roleRouteTargets";

const auth = vi.hoisted(() => ({
  current: { user: null as AuthUser | null, isReady: true },
}));

vi.mock("@/features/auth/useAuth", () => ({ useAuth: () => auth.current }));
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    // Capture redirects during server rendering; the browser suite exercises
    // their actual navigation and history behavior.
    Navigate: (props: ComponentProps<typeof Navigate>) => createElement("output", {
      "data-redirect": typeof props.to === "string" ? props.to : props.to.pathname,
      "data-from": (props.state as { from?: string } | undefined)?.from ?? "",
      "data-replace": String(!!props.replace),
    }),
  };
});

vi.mock("@/layouts/AdminLayout", () => ({ default: () => createElement("main", { "data-admin": true }, createElement(Outlet)) }));
vi.mock("@/layouts/AuthLayout", () => ({ default: () => createElement("main", { "data-auth": true }, createElement(Outlet)) }));
vi.mock("@/layouts/SectionPage", () => ({ default: () => createElement("p", null, "Section:" + useLocation().pathname) }));
vi.mock("@/features/dashboard/DashboardPage", () => ({ default: () => createElement("p", null, "Dashboard") }));
vi.mock("@/features/models/ModelsPage", () => ({ default: () => createElement("p", null, "Models") }));
vi.mock("@/features/users/UsersPage", () => ({ default: () => createElement("p", null, "Users") }));
vi.mock("@/features/roles/RolesPage", () => ({ default: () => createElement("p", null, "Roles") }));
vi.mock("@/features/roles/RoleEditorPage", () => ({ default: () => createElement("p", null, "RoleEditor:" + (useParams().roleId ?? "new")) }));
vi.mock("@/features/auth/LoginPage", () => ({ default: () => createElement("p", null, "Login") }));
vi.mock("@/features/auth/ResetPasswordPage", () => ({ default: () => createElement("p", null, "ResetPassword") }));
vi.mock("@/features/auth/VerifyOtpPage", () => ({ default: () => createElement("p", null, "VerifyOtp") }));
vi.mock("@/features/auth/SetPasswordPage", () => ({ default: () => createElement("p", null, "SetPassword") }));

const roleCases = [
  ["superadmin", AppRole.SuperAdministrator],
  ["content_manager", AppRole.ContentManager],
  ["approver", AppRole.Approver],
  ["marketing", AppRole.MarketingSpecialist],
  ["sales_rep", AppRole.SalesRepresentative],
  ["service_advisor", AppRole.ServiceAdvisor],
  ["guest", AppRole.Guest],
  ["bespoke_reviewer", AppRole.Guest],
] as const;

const allPermissions = [
  "models.view", "models.create", "offers.view", "offers.publish", "bookings.view",
  "articles.create", "articles.publish", "pages.create", "pages.publish", "leads.view",
  "media.upload", "media.delete", "models.publish", "audit_logs.view",
  "users.view", "users.create", "users.update", "users.delete", "roles.view", "roles.manage",
];

function user(code: string, codes: readonly string[] = allPermissions): AuthUser {
  return {
    id: 1, first_name: "Routing", last_name: "Fixture", full_name: "Routing Fixture",
    email: "routing@example.test", status: "active", last_login_at: null, created_at: "2026-10-01",
    role: {
      id: 5, name: "Backend role label", code, description: "", is_system: code === "superadmin",
      permissions: codes.map((permission, index) => ({ id: index + 1, name: permission, code: permission, description: "" })),
    },
  };
}

function render(path: string, state?: { from?: string }) {
  return renderToStaticMarkup(createElement(MemoryRouter, {
    initialEntries: [{ pathname: path, state }],
  }, createElement(AppRoutes)));
}

beforeEach(() => {
  auth.current.user = null;
  auth.current.isReady = true;
});

describe("Role routing structure", () => {
  it.each(roleCases)("classifies %s without changing backend role data", (code, expected) => {
    const original = user(code);
    auth.current.user = original;
    expect(resolveAppRouteRole(code)).toBe(expected);
    expect(render("/models")).toContain("Models");
    expect(auth.current.user).toBe(original);
    expect(original.role.code).toBe(code);
    expect(original.role.name).toBe("Backend role label");
  });

  it.each([undefined, null, "", "constructor", "__proto__", "unknown_role"])(
    "uses the guest group for an unrecognized role %s", (code) => {
      expect(resolveAppRouteRole(code)).toBe(AppRole.Guest);
    },
  );

  it.each(roleCases)("retains every existing CMS URL and dynamic role parameter for %s", (code) => {
    auth.current.user = user(code);
    const paths = [
      ["/dashboard", "Dashboard"], ["/models", "Models"], ["/offers", "Section:/offers"],
      ["/test-drive", "Section:/test-drive"], ["/book-service", "Section:/book-service"],
      ["/ev-technology", "Section:/ev-technology"], ["/owners", "Section:/owners"],
      ["/news", "Section:/news"], ["/contact", "Section:/contact"], ["/leads", "Section:/leads"],
      ["/branches", "Section:/branches"], ["/media", "Section:/media"], ["/approvals", "Section:/approvals"],
      ["/audit", "Section:/audit"], ["/settings/users", "Users"], ["/settings/roles", "Roles"],
      ["/settings/seo", "Section:/settings/seo"], ["/settings/roles/new", "RoleEditor:new"],
      ["/settings/roles/12", "RoleEditor:12"],
    ];
    for (const [path, page] of paths) {
      const html = render(path);
      expect(html, path).toContain(page);
      expect(html, path).toContain('data-admin="true"');
      expect(html, path).not.toContain("data-redirect");
    }
  });

  it.each(roleCases)("keeps permission denial for %s, including Super Administrator and guest", (code) => {
    auth.current.user = user(code, []);
    const denied = [
      "/models", "/offers", "/test-drive", "/news", "/contact", "/leads", "/media",
      "/approvals", "/audit", "/settings/users", "/settings/roles", "/settings/roles/new", "/settings/roles/2",
    ];
    for (const path of denied) expect(render(path), path).toContain('data-redirect="/dashboard"');
    for (const path of ["/dashboard", "/book-service", "/ev-technology", "/owners", "/branches", "/settings/seo"]) {
      expect(render(path), path).not.toContain("data-redirect");
    }
  });

  it("lets an authenticated custom role use its granted permissions without becoming anonymous", () => {
    auth.current.user = user("custom_catalog_reader", ["models.view"]);
    expect(render("/models")).toContain("Models");
    expect(render("/settings/users")).toContain('data-redirect="/dashboard"');
    expect(render("/login")).toContain('data-redirect="/dashboard"');
    expect(auth.current.user.role.code).toBe("custom_catalog_reader");
  });
});

describe("Public routes, session guards, and redirects", () => {
  it.each([
    ["/login", "Login"], ["/reset-password", "ResetPassword"],
    ["/reset-password/verify", "VerifyOtp"], ["/reset-password/new", "SetPassword"],
  ])("keeps the public auth URL %s", (path, page) => {
    const html = render(path);
    expect(html).toContain(page);
    expect(html).toContain('data-auth="true"');
    expect(html).not.toContain("data-redirect");
  });

  it("remembers an anonymous visitor's protected deep link", () => {
    const html = render("/settings/roles/12");
    expect(html).toContain('data-redirect="/login"');
    expect(html).toContain('data-from="/settings/roles/12"');
    expect(html).toContain('data-replace="true"');
    expect(html).not.toContain("data-admin");
  });

  it.each(["/login", "/models"])("waits for session readiness at %s", (path) => {
    auth.current.isReady = false;
    expect(render(path)).toContain("Loading your session");
    expect(render(path)).not.toContain("data-redirect");
  });

  it("keeps the stored login destination for authenticated custom roles", () => {
    auth.current.user = user("custom_catalog_reader");
    expect(render("/login", { from: "/settings/users" })).toContain('data-redirect="/settings/users"');
    expect(render("/login", { from: "/reset-password" })).toContain('data-redirect="/dashboard"');
  });

  it.each(["/", "/does-not-exist", "/models/missing", "/auth/login"])(
    "keeps root and unknown-path behavior at %s", (path) => {
      auth.current.user = null;
      expect(render(path)).toContain('data-redirect="/login"');
      auth.current.user = user("content_manager");
      expect(render(path)).toContain('data-redirect="/dashboard"');
    },
  );

  it.each([
    ["/news", "articles.publish"], ["/media", "media.delete"], ["/approvals", "offers.publish"],
  ])("preserves any-permission access at %s", (path, permission) => {
    auth.current.user = user("guest", [permission]);
    expect(render(path)).not.toContain("data-redirect");
  });
});
