import { expect, type Page, type Route } from "@playwright/test";

export const permissionCodes = [
  "users.view", "users.create", "users.update", "users.delete", "roles.view", "roles.manage",
  "models.view", "models.create", "models.update", "models.publish", "media.upload", "media.delete",
];
export const permissions = permissionCodes.map((code, index) => ({
  id: index + 1, code, name: code, description: "Fixture " + code,
}));
export const editorRole = {
  id: 2, name: "Editor", code: "editor", description: "Fixture editor", is_system: false,
  permissions: permissions.filter((item) => item.code === "models.view"),
};
const managerRole = { ...editorRole, id: 5, name: "Manager", code: "content_manager", permissions };

function user(id: number, name: string, role = editorRole) {
  return {
    id, first_name: name, last_name: "Test", full_name: name + " Test",
    email: name.toLowerCase() + "@example.test", status: "active", role,
    last_login_at: null, created_at: "2026-10-01T12:00:00Z",
  };
}
export const envelope = (data: unknown) => ({ success: true, message: "Fixture success", data });
const headers = {
  "access-control-allow-origin": "*", "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS", "content-type": "application/json",
};
export async function respond(route: Route, data: unknown, status = 200) {
  await route.fulfill({ status, headers, body: status === 204 ? "" : JSON.stringify(data) });
}
export function deferred() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => { release = resolve; });
  return { promise, release };
}
export type ApiCall = { path: string; method: string; body: Record<string, unknown> };

export async function setupApp(page: Page, options: { guest?: boolean; path?: string; resetDraft?: { email: string; otp?: string } } = {}) {
  const state = {
    session: user(1, "Reviewer", managerRole),
    roles: [{ ...managerRole, id: 1, name: "Super Admin", code: "superadmin", is_system: true }, editorRole, managerRole],
    users: [user(2, "Alice"), user(3, "Bob")],
  };
  const calls: ApiCall[] = [];
  await page.context().addInitScript(({ session, guest, draft }) => {
    if (!sessionStorage.getItem("form-tests.seeded")) {
      if (!guest) localStorage.setItem("cms.auth", JSON.stringify({ token: "synthetic-form-token", tokenType: "Bearer", user: session }));
      if (draft) sessionStorage.setItem("sensus.passwordReset", JSON.stringify(draft));
      sessionStorage.setItem("form-tests.seeded", "1");
    }
  }, { session: state.session, guest: !!options.guest, draft: options.resetDraft });
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    if (!path.startsWith("/api/cms/v1/")) {
      if (url.origin === "http://127.0.0.1:4175") return route.continue();
      return route.abort();
    }
    if (method === "OPTIONS") return respond(route, null, 204);
    const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;
    calls.push({ path, method, body });
    const text = (key: string) => typeof body[key] === "string" ? body[key] as string : "";
    if (path.endsWith("/me")) return respond(route, envelope(state.session));
    if (path.endsWith("/login")) return respond(route, envelope({ token: "synthetic-login-token", token_type: "Bearer", user: state.session }));
    if (["/logout", "/forgot-password", "/verify-otp", "/reset-password"].some((suffix) => path.endsWith(suffix))) return respond(route, { success: true, message: "Fixture success" });
    if (path.endsWith("/permissions")) {
      const grouped: Record<string, typeof permissions> = {};
      for (const permission of permissions) (grouped[permission.code.split(".")[0]] ??= []).push(permission);
      return respond(route, envelope(grouped));
    }
    if (path.endsWith("/roles")) {
      if (method === "GET") return respond(route, envelope(state.roles));
      if (method === "POST") {
        const role = { ...editorRole, id: 20, name: text("name"), code: text("code"), description: text("description"), permissions: [] };
        state.roles.push(role);
        return respond(route, envelope(role));
      }
    }
    if (/\/roles\/\d+\/permissions$/.test(path)) {
      const role = state.roles.find((item) => item.id === Number(path.split("/").at(-2)));
      if (role) role.permissions = permissions.filter((item) => Array.isArray(body.permission_ids) && body.permission_ids.includes(item.id));
      return respond(route, envelope(role));
    }
    if (/\/roles\/\d+$/.test(path)) {
      const role = state.roles.find((item) => item.id === Number(path.split("/").at(-1)));
      if (role && method === "PUT") Object.assign(role, { name: text("name"), code: text("code"), description: text("description") });
      return respond(route, envelope(role));
    }
    if (path.endsWith("/users")) {
      if (method === "GET") return respond(route, { ...envelope(state.users), meta: { total: state.users.length, per_page: 15, current_page: 1, last_page: 1 } });
      if (method === "POST") {
        const created = { ...user(20, text("first_name"), state.roles.find((item) => item.id === body.role_id)), last_name: text("last_name"), email: text("email"), status: text("status") };
        created.full_name = created.first_name + " " + created.last_name;
        state.users.push(created);
        return respond(route, envelope(created));
      }
    }
    if (/\/users\/\d+$/.test(path) && method === "PUT") {
      const updated = state.users.find((item) => item.id === Number(path.split("/").at(-1)));
      if (updated) {
        Object.assign(updated, { first_name: text("first_name"), last_name: text("last_name"), email: text("email"), status: text("status") });
        updated.role = state.roles.find((item) => item.id === body.role_id) ?? editorRole;
        updated.full_name = updated.first_name + " " + updated.last_name;
      }
      return respond(route, envelope(updated));
    }
    throw new Error("Unexpected fixture request: " + method + " " + path);
  });
  await page.goto(options.path ?? "/settings/users");
  await page.waitForLoadState("networkidle");
  return { state, calls };
}

export async function fillAddUser(page: Page) {
  await page.getByRole("button", { name: "Add user", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.locator('input[name="first_name"]').fill(" New ");
  await dialog.locator('input[name="last_name"]').fill(" Person ");
  await dialog.locator('input[name="email"]').fill("new@example.test");
  await dialog.locator('input[name="password"]').fill("12345678");
  await dialog.locator('input[name="password_confirmation"]').fill("12345678");
  await dialog.locator('select[name="role_id"]').selectOption("2");
  return dialog;
}

export async function openModel(page: Page) {
  await page.getByRole("button", { name: "T2 t2", exact: true }).click();
  await expect(page.getByRole("heading", { name: "T2", exact: true })).toBeVisible();
  return page.locator("form").first();
}
