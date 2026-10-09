import { test, expect } from "@playwright/test";
import { setupApp, fillAddUser, openModel, respond, deferred, envelope } from "./helpers";

let runtimeErrors: string[] = [];
test.beforeEach(({ page }) => {
  runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
});
test.afterEach(() => { expect(runtimeErrors).toEqual([]); });

test("login validates, clears edited-field errors, and preserves reveal behavior", async ({ page }) => {
  const app = await setupApp(page, { guest: true, path: "/login" });
  await page.getByRole("button", { name: "LOGIN", exact: true }).click();
  await expect(page.getByText("Enter a valid email address.", { exact: true })).toBeVisible();
  await expect(page.getByText("Enter your password.", { exact: true })).toBeVisible();
  expect(app.calls.filter((call) => call.path.endsWith("/login"))).toHaveLength(0);
  await page.locator('input[name="email"]').fill("reviewer@example.test");
  await expect(page.getByText("Enter a valid email address.", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Enter your password.", { exact: true })).toBeVisible();
  await page.locator('input[name="password"]').fill("x");
  await page.getByRole("button", { name: "Show password", exact: true }).click();
  await expect(page.locator('input[name="password"]')).toHaveAttribute("type", "text");
  await expect(page.locator('input[name="password"]')).toHaveValue("x");
  await page.locator('input[name="password"]').press("Enter");
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(app.calls.find((call) => call.path.endsWith("/login"))?.body).toEqual({ email: "reviewer@example.test", password: "x" });
});

test("login keeps entered values after API failure and allows retry", async ({ page }) => {
  const app = await setupApp(page, { guest: true, path: "/login" });
  let requests = 0;
  await page.context().route("**/api/cms/v1/login", async (route) => {
    if (route.request().method() === "OPTIONS") return respond(route, null, 204);
    requests++;
    return requests === 1
      ? respond(route, { success: false, message: "Invalid credentials." }, 401)
      : respond(route, envelope({ token: "synthetic-retry-token", token_type: "Bearer", user: app.state.session }));
  });
  await page.locator('input[name="email"]').fill("reviewer@example.test");
  await page.locator('input[name="password"]').fill("retry-password");
  await page.getByRole("button", { name: "LOGIN", exact: true }).click();
  await expect(page.getByText("Invalid credentials.", { exact: true })).toBeVisible();
  await expect(page.locator('input[name="password"]')).toHaveValue("retry-password");
  await page.getByRole("button", { name: "LOGIN", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(requests).toBe(2);
});

test("rapid repeated login submissions issue one request", async ({ page }) => {
  const app = await setupApp(page, { guest: true, path: "/login" });
  const gate = deferred();
  let requests = 0;
  await page.context().route("**/api/cms/v1/login", async (route) => {
    if (route.request().method() === "OPTIONS") return respond(route, null, 204);
    requests++;
    await gate.promise;
    await respond(route, envelope({ token: "synthetic-once-token", token_type: "Bearer", user: app.state.session }));
  });
  await page.locator('input[name="email"]').fill("reviewer@example.test");
  await page.locator('input[name="password"]').fill("password");
  await page.locator("form").evaluate((form: HTMLFormElement) => { form.requestSubmit(); form.requestSubmit(); form.requestSubmit(); });
  await expect(page.getByRole("button", { name: "WAIT", exact: true })).toBeDisabled();
  expect(requests).toBe(1);
  gate.release();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(requests).toBe(1);
});

test("password reset validates email and keeps the email through OTP navigation", async ({ page }) => {
  const app = await setupApp(page, { guest: true, path: "/reset-password" });
  await page.getByRole("button", { name: "SEND", exact: true }).click();
  await expect(page.getByText("Enter a valid email address.", { exact: true })).toBeVisible();
  expect(app.calls).toHaveLength(0);
  await page.locator('input[name="email"]').fill("reviewer@example.test");
  await page.getByRole("button", { name: "SEND", exact: true }).click();
  await expect(page).toHaveURL(/\/reset-password\/verify$/);
  await page.getByRole("link", { name: "Use a different email", exact: true }).click();
  await expect(page.locator('input[name="email"]')).toHaveValue("reviewer@example.test");
  expect(app.calls.find((call) => call.path.endsWith("/forgot-password"))?.body).toEqual({ email: "reviewer@example.test" });
});

test("OTP retains paste, gap validation, backspace, and arrow navigation", async ({ page }) => {
  const app = await setupApp(page, { guest: true, path: "/reset-password/verify", resetDraft: { email: "reviewer@example.test" } });
  await page.getByRole("button", { name: "VERIFY", exact: true }).click();
  await expect(page.getByText("Enter the 6-digit code.", { exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Digit 1", exact: true }).fill("1");
  await page.getByRole("textbox", { name: "Digit 3", exact: true }).fill("3");
  await page.getByRole("button", { name: "VERIFY", exact: true }).click();
  await expect(page.getByText("Enter the 6-digit code.", { exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Digit 1", exact: true }).evaluate((input: HTMLInputElement) => {
    const data = new DataTransfer();
    data.setData("text", "12-34 56");
    input.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
  });
  for (let index = 1; index <= 6; index++) await expect(page.getByRole("textbox", { name: "Digit " + index, exact: true })).toHaveValue(String(index));
  await page.getByRole("textbox", { name: "Digit 6", exact: true }).press("ArrowLeft");
  await expect(page.getByRole("textbox", { name: "Digit 5", exact: true })).toBeFocused();
  await page.getByRole("textbox", { name: "Digit 6", exact: true }).fill("");
  await page.getByRole("textbox", { name: "Digit 6", exact: true }).press("Backspace");
  await expect(page.getByRole("textbox", { name: "Digit 5", exact: true })).toHaveValue("");
  await page.getByRole("textbox", { name: "Digit 5", exact: true }).fill("5");
  await page.getByRole("textbox", { name: "Digit 6", exact: true }).fill("6");
  await page.getByRole("button", { name: "VERIFY", exact: true }).click();
  await expect(page).toHaveURL(/\/reset-password\/new$/);
  expect(app.calls.find((call) => call.path.endsWith("/verify-otp"))?.body).toEqual({ email: "reviewer@example.test", otp: "123456" });
});

test("new password requires matching confirmation and preserves the existing minimum rule", async ({ page }) => {
  const app = await setupApp(page, { guest: true, path: "/reset-password/new", resetDraft: { email: "reviewer@example.test", otp: "123456" } });
  await page.getByRole("button", { name: "RESET", exact: true }).click();
  await expect(page.getByText("Enter a new password.", { exact: true })).toBeVisible();
  await expect(page.getByText("Confirm your password.", { exact: true })).toBeVisible();
  await page.locator('input[name="password"]').fill("x");
  await page.locator('input[name="password_confirmation"]').fill("y");
  await page.getByRole("button", { name: "RESET", exact: true }).click();
  await expect(page.getByText("Passwords do not match.", { exact: true })).toBeVisible();
  expect(app.calls).toHaveLength(0);
  await page.locator('input[name="password_confirmation"]').fill("x");
  await page.getByRole("button", { name: "RESET", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(app.calls.find((call) => call.path.endsWith("/reset-password"))?.body).toEqual({ email: "reviewer@example.test", otp: "123456", password: "x", password_confirmation: "x" });
  expect(await page.evaluate(() => sessionStorage.getItem("sensus.passwordReset"))).toBeNull();
});

test("add user validates fields before API submission and clears errors individually", async ({ page }) => {
  const app = await setupApp(page);
  await page.getByRole("button", { name: "Add user", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Submit", exact: true }).click();
  for (const message of ["Enter a first name.", "Enter a last name.", "Enter a valid email address.", "Enter a password.", "Choose a role."]) await expect(dialog.getByText(message, { exact: true })).toBeVisible();
  expect(app.calls.filter((call) => call.method === "POST")).toHaveLength(0);
  await dialog.locator('input[name="first_name"]').fill("Valid");
  await expect(dialog.getByText("Enter a first name.", { exact: true })).toHaveCount(0);
  await expect(dialog.getByText("Enter a last name.", { exact: true })).toBeVisible();
  await dialog.locator('input[name="password"]').fill("1234567");
  await dialog.locator('input[name="password_confirmation"]').fill("mismatch");
  await dialog.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(dialog.getByText("Use at least 8 characters.", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Passwords do not match.", { exact: true })).toBeVisible();
});

test("add user preserves normalized payload, status, selected role, and close behavior", async ({ page }) => {
  const app = await setupApp(page);
  const dialog = await fillAddUser(page);
  await dialog.locator('select[name="status"]').selectOption("inactive");
  await dialog.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText("New Person", { exact: true })).toBeVisible();
  expect(app.calls.find((call) => call.path.endsWith("/users") && call.method === "POST")?.body).toEqual({
    first_name: "New", last_name: "Person", email: "new@example.test", password: "12345678",
    password_confirmation: "12345678", role_id: 2, status: "inactive",
  });
});

test("add-user API failure keeps draft and enables retry", async ({ page }) => {
  await setupApp(page);
  let requests = 0;
  await page.context().route("**/api/cms/v1/users", async (route) => {
    if (route.request().method() === "OPTIONS") return respond(route, null, 204);
    if (route.request().method() !== "POST") return route.fallback();
    requests++;
    return requests === 1
      ? respond(route, { success: false, message: "Email is already taken." }, 422)
      : route.fallback();
  });
  const dialog = await fillAddUser(page);
  await dialog.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByText("Email is already taken.", { exact: true })).toBeVisible();
  await expect(dialog.locator('input[name="password"]')).toHaveValue("12345678");
  await expect(dialog.getByRole("button", { name: "Submit", exact: true })).toBeEnabled();
  await dialog.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(requests).toBe(2);
});

test("user dialog stays busy through delayed list refresh and suppresses repeated submits", async ({ page }) => {
  await setupApp(page);
  const gate = deferred();
  let created = false;
  let postRequests = 0;
  await page.context().route("**/api/cms/v1/users?**", async (route) => {
    if (route.request().method() === "OPTIONS") return respond(route, null, 204);
    if (created) await gate.promise;
    return route.fallback();
  });
  await page.context().route("**/api/cms/v1/users", async (route) => {
    if (route.request().method() === "OPTIONS") return respond(route, null, 204);
    if (route.request().method() === "POST") { postRequests++; created = true; }
    return route.fallback();
  });
  const dialog = await fillAddUser(page);
  await dialog.locator("form").evaluate((form: HTMLFormElement) => { form.requestSubmit(); form.requestSubmit(); });
  await expect(dialog.getByRole("button", { name: "Saving...", exact: true })).toBeDisabled();
  await expect.poll(() => postRequests).toBe(1);
  await expect(page.locator('[aria-busy="true"]')).toBeVisible();
  gate.release();
  await expect(dialog).toHaveCount(0);
  expect(postRequests).toBe(1);
});

test("edit user leaves password unchanged when both fields are blank", async ({ page }) => {
  const app = await setupApp(page);
  await page.getByRole("button", { name: "Edit Bob Test", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator('input[name="first_name"]')).toHaveValue("Bob");
  await dialog.locator('input[name="first_name"]').fill(" Updated ");
  await dialog.locator('select[name="status"]').selectOption("suspended");
  await dialog.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(app.calls.find((call) => call.path.endsWith("/users/3") && call.method === "PUT")?.body).toEqual({
    first_name: "Updated", last_name: "Test", email: "bob@example.test", status: "suspended",
    role_id: 2, password: "", password_confirmation: "",
  });
});

test("edit user validates optional password changes as a matching pair", async ({ page }) => {
  const app = await setupApp(page);
  await page.getByRole("button", { name: "Edit Alice Test", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.locator('input[name="password_confirmation"]').fill("12345678");
  await dialog.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(dialog.getByText("Use at least 8 characters.", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Passwords do not match.", { exact: true })).toBeVisible();
  expect(app.calls.filter((call) => call.method === "PUT")).toHaveLength(0);
  await dialog.locator('input[name="password"]').fill("12345678");
  await dialog.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(app.calls.find((call) => call.method === "PUT")?.body.password).toBe("12345678");
});

test("user modals reset discarded drafts and passwords on reopening or switching users", async ({ page }) => {
  await setupApp(page);
  await page.getByRole("button", { name: "Edit Alice Test", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog.locator('input[name="first_name"]').fill("Discarded");
  await dialog.locator('input[name="password"]').fill("discarded-password");
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Edit Alice Test", exact: true }).click();
  dialog = page.getByRole("dialog");
  await expect(dialog.locator('input[name="first_name"]')).toHaveValue("Alice");
  await expect(dialog.locator('input[name="password"]')).toHaveValue("");
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Edit Bob Test", exact: true }).click();
  await expect(page.getByRole("dialog").locator('input[name="first_name"]')).toHaveValue("Bob");
  await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
  dialog = await fillAddUser(page);
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Add user", exact: true }).click();
  await expect(page.getByRole("dialog").locator('input[name="password"]')).toHaveValue("");
});

test("role name validation, generated code, description, and grouped selections work", async ({ page }) => {
  const app = await setupApp(page, { path: "/settings/roles/new" });
  await page.getByRole("button", { name: "Create role", exact: true }).click();
  await expect(page.getByText("Enter a role name.", { exact: true })).toBeVisible();
  await page.locator('input[name="name"]').fill("!!!");
  await page.getByRole("button", { name: "Create role", exact: true }).click();
  await expect(page.getByText("Enter a role name that can be turned into a code.", { exact: true })).toBeVisible();
  await page.locator('input[name="name"]').fill(" Senior Editor ");
  await expect(page.locator('input[name="code"]')).toHaveValue("senior_editor");
  await page.locator('textarea[name="description"]').fill(" Description ");
  const users = page.locator("section").filter({ has: page.getByRole("heading", { name: "Users", exact: true }) }).last();
  await users.getByRole("checkbox", { name: "Select all", exact: true }).check();
  await expect(page.getByText("4 selected", { exact: true })).toBeVisible();
  await users.getByRole("checkbox", { name: "users.delete", exact: false }).uncheck();
  await expect(users.getByRole("checkbox", { name: "Select all", exact: true })).toHaveJSProperty("indeterminate", true);
  await page.getByRole("button", { name: "Create role", exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/roles$/);
  expect(app.calls.find((call) => call.path.endsWith("/roles") && call.method === "POST")?.body).toEqual({ name: "Senior Editor", code: "senior_editor", description: "Description" });
  expect(app.calls.find((call) => call.path.endsWith("/roles/20/permissions"))?.body).toEqual({ permission_ids: [1, 2, 3] });
});

test("editing role label preserves its code; system roles remain read-only", async ({ page }) => {
  const app = await setupApp(page, { path: "/settings/roles/2" });
  await page.locator('input[name="name"]').fill("!!!");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/roles$/);
  expect(app.calls.find((call) => call.path.endsWith("/roles/2") && call.method === "PUT")?.body.code).toBe("editor");
  await page.goto("/settings/roles/1");
  await expect(page.locator('input[name="name"]')).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save changes", exact: true })).toHaveCount(0);
  for (const checkbox of await page.getByRole("checkbox").all()) await expect(checkbox).toBeDisabled();
});

test("model creation preserves generated and manually overridden codes/slugs", async ({ page }) => {
  await setupApp(page, { path: "/models" });
  await page.getByRole("button", { name: "New model", exact: true }).click();
  await page.getByRole("button", { name: "Create model", exact: true }).click();
  await expect(page.getByText("Enter a model name.", { exact: true })).toBeVisible();
  await page.locator('input[name="name"]').fill("Family & Sport");
  await expect(page.locator('input[name="slug"]')).toHaveValue("family-and-sport");
  await expect(page.locator('input[name="code"]')).toHaveValue("FAMILYANDSPORT");
  await page.locator('input[name="code"]').fill("custom");
  await page.locator('input[name="slug"]').fill("custom-slug");
  await page.locator('input[name="name"]').fill("New Family");
  await expect(page.locator('input[name="code"]')).toHaveValue("CUSTOM");
  await expect(page.locator('input[name="slug"]')).toHaveValue("custom-slug");
  await page.getByRole("button", { name: "Create model", exact: true }).click();
  await expect(page.getByRole("heading", { name: "New Family", exact: true })).toBeVisible();
  await expect(page.locator("form").first().locator('input[name="code"]')).toHaveValue("CUSTOM");
  await page.getByRole("button", { name: "Back to models", exact: true }).click();
  await page.getByRole("button", { name: "New model", exact: true }).click();
  await expect(page.locator('input[name="name"]')).toHaveValue("");
  await page.locator('input[name="name"]').fill("Fresh");
  await expect(page.locator('input[name="code"]')).toHaveValue("FRESH");
});

test("model creation rejects duplicate code and slug within its OEM", async ({ page }) => {
  await setupApp(page, { path: "/models" });
  await page.getByRole("button", { name: "New model", exact: true }).click();
  await page.locator('input[name="name"]').fill("T2");
  await page.getByRole("button", { name: "Create model", exact: true }).click();
  await expect(page.getByText("This code is already used for this OEM.", { exact: true })).toBeVisible();
  await page.locator('input[name="code"]').fill("UNIQUE");
  await page.getByRole("button", { name: "Create model", exact: true }).click();
  await expect(page.getByText("This slug is already used for this OEM.", { exact: true })).toBeVisible();
  await page.locator('select[name="oemId"]').selectOption("oem-soueast");
  await page.getByRole("button", { name: "Create model", exact: true }).click();
  await expect(page.getByRole("heading", { name: "T2", exact: true })).toBeVisible();
});

test("model workspace validates edits and accepts unchanged identifiers", async ({ page }) => {
  await setupApp(page, { path: "/models" });
  const form = await openModel(page);
  await form.locator('input[name="name"]').fill(" ");
  await form.getByRole("button", { name: "Save model", exact: true }).click();
  await expect(form.getByText("Enter a model name.", { exact: true })).toBeVisible();
  await form.locator('input[name="name"]').fill("Updated T2");
  await form.getByRole("button", { name: "Save model", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Updated T2", exact: true })).toBeVisible();
  await expect(form.getByText("Enter a model name.", { exact: true })).toHaveCount(0);
});

test("version form checks year boundaries, duplicate codes, draft retention, and reset", async ({ page }) => {
  await setupApp(page, { path: "/models" });
  await openModel(page);
  await page.getByRole("button", { name: "Add version", exact: true }).click();
  let form = page.locator("form").nth(1);
  await form.getByRole("button", { name: "Add version", exact: true }).click();
  await expect(form.getByText("Enter a version code.", { exact: true })).toBeVisible();
  await form.locator('input[name="code"]').fill("2026");
  await form.locator('input[name="name"]').fill("New Version");
  await form.locator('input[name="modelYear"]').fill("1979");
  await form.getByRole("button", { name: "Add version", exact: true }).click();
  await expect(form.getByText("Enter a four-digit model year.", { exact: true })).toBeVisible();
  await form.locator('input[name="modelYear"]').fill("2101");
  await form.getByRole("button", { name: "Add version", exact: true }).click();
  await expect(form.getByText("Enter a four-digit model year.", { exact: true })).toBeVisible();
  await form.locator('input[name="modelYear"]').fill("2100");
  await form.getByRole("button", { name: "Add version", exact: true }).click();
  await expect(form.getByText("This code is already used on this model.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Add version", exact: true }).click();
  form = page.locator("form").nth(1);
  await expect(form.locator('input[name="name"]')).toHaveValue("New Version");
  await form.locator('input[name="code"]').fill("2100");
  await form.getByRole("button", { name: "Add version", exact: true }).click();
  await expect(page.getByRole("button", { name: "Add version", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add version", exact: true }).click();
  await expect(page.locator("form").nth(1).locator('input[name="name"]')).toHaveValue("");
});

test("trim validation keeps decimal price, currency, powertrain, and uniqueness behavior", async ({ page }) => {
  await setupApp(page, { path: "/models" });
  await openModel(page);
  await page.getByRole("button", { name: "Add trim", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Add trim", exact: true }).click();
  await expect(dialog.getByText("Enter a trim code.", { exact: true })).toBeVisible();
  await dialog.locator('input[name="code"]').fill("comfort");
  await expect(dialog.locator('input[name="code"]')).toHaveValue("COMFORT");
  await dialog.locator('input[name="name"]').fill("New Trim");
  await dialog.locator('input[name="price"]').fill("-1");
  await dialog.getByRole("button", { name: "Add trim", exact: true }).click();
  await expect(dialog.getByText("Enter the current retail price.", { exact: true })).toBeVisible();
  await dialog.locator('input[name="price"]').fill("12345.678");
  await dialog.getByRole("button", { name: "Add trim", exact: true }).click();
  await expect(dialog.getByText("This code is already used on this version.", { exact: true })).toBeVisible();
  await dialog.locator('input[name="code"]').fill("NEW");
  await dialog.locator('select[name="currencyCode"]').selectOption("USD");
  await dialog.locator('select[name="powertrainType"]').selectOption("electric");
  await dialog.getByRole("button", { name: "Add trim", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const row = page.getByRole("row").filter({ hasText: "New Trim" });
  await expect(row).toContainText("Electric");
  await expect(row).toContainText("12,346");
  await expect(row).toContainText("$12,346");
});

test("profile validates its name and preserves local language/picture updates", async ({ page }) => {
  await setupApp(page);
  await page.getByRole("button", { name: "Update profile", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Loading your profile…", { exact: true })).toHaveCount(0);
  await dialog.locator('input[name="name"]').fill(" ");
  await dialog.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(dialog.getByText("Enter your name.", { exact: true })).toBeVisible();
  await dialog.locator('input[name="name"]').fill(" Local Profile ");
  await dialog.locator('input[type="file"]').setInputFiles({ name: "bad.gif", mimeType: "image/gif", buffer: Buffer.from("invalid") });
  await expect(dialog.getByText("Use a JPG, PNG, or SVG file.", { exact: true })).toBeVisible();
  await dialog.locator('input[type="file"]').setInputFiles({ name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(10 * 1024 * 1024 + 1) });
  await expect(dialog.getByText("Picture must be 10 MB or smaller.", { exact: true })).toBeVisible();
  await dialog.locator('input[type="file"]').setInputFiles({ name: "valid.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==", "base64") });
  await expect(dialog.locator("img")).toHaveAttribute("src", /^data:image\/png/);
  await dialog.getByRole("button", { name: "Language", exact: true }).click();
  await dialog.getByRole("button", { name: "Arabic", exact: true }).click();
  await dialog.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const session = await page.evaluate(() => JSON.parse(localStorage.getItem("cms.auth") || "{}")) as { user: { full_name: string; language: string; picture: string } };
  expect(session.user.full_name).toBe("Local Profile");
  expect(session.user.language).toBe("ar");
  expect(session.user.picture).toMatch(/^data:image\/png/);
});

test("profile fetch cannot overwrite an edited name, and cancel discards draft", async ({ page }) => {
  const app = await setupApp(page);
  const gate = deferred();
  await page.context().route("**/api/cms/v1/me", async (route) => {
    if (route.request().method() === "OPTIONS") return respond(route, null, 204);
    await gate.promise;
    await respond(route, envelope(app.state.session));
  });
  await page.getByRole("button", { name: "Update profile", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Loading your profile…", { exact: true })).toBeVisible();
  await dialog.locator('input[name="name"]').fill("Unsaved Name");
  gate.release();
  await expect(dialog.getByText("Loading your profile…", { exact: true })).toHaveCount(0);
  await expect(dialog.locator('input[name="name"]')).toHaveValue("Unsaved Name");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "Update profile", exact: true }).click();
  await expect(page.getByRole("dialog").locator('input[name="name"]')).toHaveValue("Reviewer Test");
});

for (const scenario of [
  { title: "email reset", path: "/reset-password", endpoint: "forgot-password", button: "SEND", draft: undefined, fields: { email: "reviewer@example.test" }, next: /\/reset-password\/verify$/ },
  { title: "OTP verification", path: "/reset-password/verify", endpoint: "verify-otp", button: "VERIFY", draft: { email: "reviewer@example.test" }, fields: { otp: "123456" }, next: /\/reset-password\/new$/ },
  { title: "new password", path: "/reset-password/new", endpoint: "reset-password", button: "RESET", draft: { email: "reviewer@example.test", otp: "123456" }, fields: { password: "x", password_confirmation: "x" }, next: /\/login$/ },
]) {
  test(scenario.title + " retains values after API failure and supports retry", async ({ page }) => {
    await setupApp(page, { guest: true, path: scenario.path, resetDraft: scenario.draft });
    let requests = 0;
    await page.context().route("**/api/cms/v1/" + scenario.endpoint, async (route) => {
      if (route.request().method() === "OPTIONS") return respond(route, null, 204);
      requests++;
      if (requests === 1) return respond(route, { success: false, message: "Try again." }, 422);
      return route.fallback();
    });
    for (const [name, value] of Object.entries(scenario.fields)) {
      if (value === undefined) continue;
      if (name === "otp") await page.getByRole("textbox", { name: "Digit 1", exact: true }).fill(value);
      else await page.locator('input[name="' + name + '"]').fill(value);
    }
    await page.getByRole("button", { name: scenario.button, exact: true }).click();
    await expect(page.getByText("Try again.", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: scenario.button, exact: true })).toBeEnabled();
    for (const [name, value] of Object.entries(scenario.fields)) {
      if (value === undefined) continue;
      if (name === "otp") {
        for (let index = 1; index <= 6; index++) await expect(page.getByRole("textbox", { name: "Digit " + index, exact: true })).toHaveValue(String(index));
      } else await expect(page.locator('input[name="' + name + '"]')).toHaveValue(value);
    }
    await page.getByRole("button", { name: scenario.button, exact: true }).click();
    await expect(page).toHaveURL(scenario.next);
    expect(requests).toBe(2);
  });
}

test("controlled user password reveal keeps the submitted value", async ({ page }) => {
  const app = await setupApp(page);
  const dialog = await fillAddUser(page);
  const password = dialog.locator('input[name="password"]');
  await dialog.getByRole("button", { name: "Show password", exact: true }).first().click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(password).toHaveValue("12345678");
  await dialog.getByRole("button", { name: "Hide password", exact: true }).click();
  await expect(password).toHaveAttribute("type", "password");
  await dialog.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(app.calls.find((call) => call.path.endsWith("/users") && call.method === "POST")?.body.password).toBe("12345678");
});

test("detected profile location and removed picture persist through form submission", async ({ page }) => {
  await setupApp(page);
  await page.context().grantPermissions(["geolocation"]);
  await page.context().setGeolocation({ latitude: 24.7, longitude: 46.7 });
  await page.context().route("**/data/reverse-geocode-client?**", (route) => respond(route, { city: "Fixture City" }));
  await page.getByRole("button", { name: "Update profile", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Get Location", exact: true }).click();
  await expect(dialog.getByText("Fixture City", { exact: true })).toBeVisible();
  await dialog.locator('input[type="file"]').setInputFiles({ name: "valid.svg", mimeType: "image/svg+xml", buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>') });
  await expect(dialog.locator("img")).toHaveAttribute("src", /^data:image\/svg\+xml/);
  await dialog.getByRole("button", { name: "Remove Picture", exact: true }).click();
  await expect(dialog.locator("img")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const session = await page.evaluate(() => JSON.parse(localStorage.getItem("cms.auth") || "{}")) as { user: { city: string; timeZone: string; picture?: string } };
  expect(session.user.city).toBe("Fixture City");
  expect(session.user.timeZone).toBeTruthy();
  expect(session.user.picture).toBeUndefined();
});
