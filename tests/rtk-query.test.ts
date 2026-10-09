import { configureStore } from "@reduxjs/toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setUnauthorizedHandler } from "@/redux/store/baseQuery";
import { getAccessToken, saveAuth } from "@/services/authStorage";
import { authApi } from "@/redux/api/authApi";
import { cmsApi } from "@/redux/api/baseApi";
import { roleApi } from "@/redux/api/roleApi";
import { userApi } from "@/redux/api/userApi";
import { ApiErrorKind } from "@/redux/constants";
import { rootReducer } from "@/redux/store/rootReducer";
import { waitForQueryRefresh } from "@/redux/store/queryRefresh";
import type { ApiUser } from "@/features/auth/authTypes";
import type { CmsRole, RolePayload } from "@/features/roles/roleTypes";
import type { CreateUserPayload, FetchUsersParams } from "@/features/users/userTypes";
import type { CmsUser } from "@/features/users/userTypes";
import type { ApiEnvelope } from "@/types/api";
import { getApiErrorMessage } from "@/utils/apiError";

const permission = { id: 1, name: "View users", code: "users.view", description: "Read accounts" };
const role: CmsRole = { id: 5, name: "Editor", code: "editor", description: "", is_system: false, permissions: [permission] };
const session: ApiUser = {
  id: 1, full_name: "Reviewer Test", first_name: "Reviewer", last_name: "Test", email: "reviewer@example.test",
  status: "active", role, last_login_at: null, created_at: "2026-10-01T12:00:00Z",
};
const params: FetchUsersParams = { search: "", roleId: "", status: "", sortBy: "created_at", sortDir: "desc", perPage: 15, page: 1 };
const payload: CreateUserPayload = {
  first_name: "New", last_name: "Person", email: "new@example.test", password: "SyntheticPassword123!",
  password_confirmation: "SyntheticPassword123!", role_id: 5, status: "active",
};
const rolePayload: RolePayload = { name: "Custom Editor", code: "custom_editor", description: "Fixture role" };

function user(id: number, name = "Alice"): CmsUser {
  return { ...session, id, first_name: name, full_name: `${name} Test`, email: `${name.toLowerCase()}@example.test`, created_by: null, updated_by: null, updated_at: null };
}
function envelope<T>(data: T, message = "Fixture success"): ApiEnvelope<T> {
  return { success: true, message, data };
}
function response(_config: TestRequest, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
function fail(config: TestRequest, status: number, data: unknown): Response {
  return response(config, data, status);
}
function list(config: TestRequest, users: CmsUser[]) {
  return response(config, { ...envelope(users), meta: { current_page: 1, last_page: 1, per_page: 15, total: users.length } });
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
function buildStore() {
  return configureStore({ reducer: rootReducer, middleware: (getDefault) => getDefault().concat(cmsApi.middleware) });
}
function createStore() {
  const store = buildStore();
  stores.push(store);
  return store;
}

type TestRequest = {
  request: Request;
  url: string;
  method: string;
  headers: Headers;
  params: Record<string, string>;
  data: string;
};
type FetchHandler = (request: TestRequest) => Promise<Response>;
const stores: ReturnType<typeof buildStore>[] = [];
let handle: FetchHandler;
let calls: TestRequest[];

beforeEach(() => {
  const storage = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
  saveAuth("synthetic-test-token", session);
  calls = [];
  handle = async (config) => { throw new Error(`Unexpected test request: ${config.method} ${config.url}`); };
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);
    const config: TestRequest = {
      request, url: url.pathname, method: request.method.toLowerCase(), headers: request.headers,
      params: Object.fromEntries(url.searchParams), data: await request.clone().text(),
    };
    calls.push(config);
    return handle(config);
  });
});

afterEach(() => {
  for (const store of stores.splice(0)) store.dispatch(cmsApi.util.resetApiState());
  setUnauthorizedHandler(null);
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("RTK Query fetch transport", () => {
  it("preserves user request parameters and separates cached pages while deduplicating identical reads", async () => {
    const store = createStore();
    handle = async (config) => list(config, [user(Number(config.params.page))]);
    const filters = { ...params, search: " Alice ", roleId: "5", status: "active", perPage: 25 };
    await store.dispatch(userApi.endpoints.getUsers.initiate(filters)).unwrap();
    await store.dispatch(userApi.endpoints.getUsers.initiate({ ...filters })).unwrap();
    await store.dispatch(userApi.endpoints.getUsers.initiate({ ...filters, page: 2 })).unwrap();
    expect(calls).toHaveLength(2);
    expect(calls[0].params).toEqual({ sort_by: "created_at", sort_dir: "desc", per_page: "25", page: "1", search: "Alice", role_id: "5", status: "active" });
    expect(calls[0].headers.get("Authorization")).toBe("Bearer synthetic-test-token");
    expect(userApi.endpoints.getUsers.select(filters)(store.getState()).data?.users[0].id).toBe(1);
    expect(userApi.endpoints.getUsers.select({ ...filters, page: 2 })(store.getState()).data?.users[0].id).toBe(2);
  });

  it("refreshes active users after creation and keeps the unrelated roles cache", async () => {
    const store = createStore();
    let users = [user(2)];
    handle = async (config) => {
      if (config.url?.endsWith("/roles")) return response(config, envelope([role]));
      if (config.method === "post") { users = [...users, user(3, "New")]; return response(config, envelope(users[1], "User created.")); }
      return list(config, users);
    };
    await store.dispatch(userApi.endpoints.getUsers.initiate(params)).unwrap();
    await store.dispatch(roleApi.endpoints.getRoles.initiate()).unwrap();
    await store.dispatch(userApi.endpoints.createUser.initiate(payload)).unwrap();
    await waitForQueryRefresh(store);
    expect(userApi.endpoints.getUsers.select(params)(store.getState()).data?.users).toHaveLength(2);
    expect(calls.filter((call) => call.url?.endsWith("/roles"))).toHaveLength(1);
    expect(JSON.parse(calls.find((call) => call.method === "post")!.data)).toEqual(payload);
  });

  it("waits for a slow older read and the fresh read scheduled after mutation invalidation", async () => {
    const store = createStore();
    const older = deferred<Response>();
    let reads = 0;
    handle = async (config) => {
      if (config.method === "post") return response(config, envelope(user(3, "New")));
      reads++;
      if (reads === 2) return older.promise;
      return list(config, reads === 1 ? [user(2)] : [user(2), user(3, "New")]);
    };
    await store.dispatch(userApi.endpoints.getUsers.initiate(params)).unwrap();
    const oldRequest = store.dispatch(userApi.endpoints.getUsers.initiate(params, { forceRefetch: true }));
    await vi.waitFor(() => expect(reads).toBe(2));
    await store.dispatch(userApi.endpoints.createUser.initiate(payload)).unwrap();
    let refreshed = false;
    const refresh = waitForQueryRefresh(store).then(() => { refreshed = true; });
    await Promise.resolve();
    expect(refreshed).toBe(false);
    older.resolve(list(calls.find((call) => call.method === "get")!, [user(2)]));
    await oldRequest;
    await refresh;
    expect(reads).toBe(3);
    expect(userApi.endpoints.getUsers.select(params)(store.getState()).data?.users).toHaveLength(2);
  });

  it("keeps validation errors readable and never retries or invalidates a failed mutation", async () => {
    const store = createStore();
    handle = async (config) => config.method === "post"
      ? fail(config, 422, { errors: { email: ["This email is already used."] } })
      : list(config, [user(2)]);
    await store.dispatch(userApi.endpoints.getUsers.initiate(params)).unwrap();
    const result = await store.dispatch(userApi.endpoints.createUser.initiate(payload));
    expect(result.error).toMatchObject({ kind: ApiErrorKind.Http, status: 422, message: "This email is already used." });
    expect(getApiErrorMessage(result.error)).toBe("This email is already used.");
    expect(calls.filter((call) => call.method === "post")).toHaveLength(1);
    expect(calls.filter((call) => call.method === "get")).toHaveLength(1);
  });

  it("preserves a created role ID when permission sync fails and retries without creating another role", async () => {
    const store = createStore();
    const consoleError = vi.spyOn(console, "error");
    let syncs = 0;
    handle = async (config) => {
      if (config.url?.endsWith("/permissions") && ++syncs === 1) return fail(config, 500, { message: "Permissions unavailable." });
      return response(config, envelope({ ...role, ...rolePayload, id: 20 }));
    };
    const result = await store.dispatch(roleApi.endpoints.saveRole.initiate({ payload: rolePayload, permissionIds: [1] }));
    expect(result.error).toMatchObject({ kind: ApiErrorKind.PermissionSync, roleId: 20, message: "Permissions unavailable." });
    await store.dispatch(roleApi.endpoints.saveRole.initiate({ roleId: 20, payload: rolePayload, permissionIds: [1] })).unwrap();
    expect(calls.filter((call) => call.method === "post" && call.url?.endsWith("/roles"))).toHaveLength(1);
    expect(calls.filter((call) => call.method === "put" && call.url?.endsWith("/roles/20"))).toHaveLength(1);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("refreshes active role details and lists after save while retaining permission definitions", async () => {
    const store = createStore();
    let current = role;
    handle = async (config) => {
      if (config.url?.endsWith("/permissions") && config.method === "get") return response(config, envelope({ users: [permission] }));
      if (config.url?.endsWith("/roles") && config.method === "get") return response(config, envelope([current]));
      if (config.method === "put") current = { ...current, ...rolePayload };
      return response(config, envelope(current));
    };
    await store.dispatch(roleApi.endpoints.getRoles.initiate()).unwrap();
    await store.dispatch(roleApi.endpoints.getRole.initiate(5)).unwrap();
    await store.dispatch(roleApi.endpoints.getGroupedPermissions.initiate()).unwrap();
    await store.dispatch(roleApi.endpoints.saveRole.initiate({ roleId: 5, payload: rolePayload, permissionIds: [1] })).unwrap();
    await waitForQueryRefresh(store);
    expect(roleApi.endpoints.getRoles.select()(store.getState()).data?.[0].name).toBe("Custom Editor");
    expect(roleApi.endpoints.getRole.select(5)(store.getState()).data?.name).toBe("Custom Editor");
    expect(calls.filter((call) => call.url?.endsWith("/permissions") && call.method === "get")).toHaveLength(1);
  });

  it("retries normal reads three times but does not retry the session query", async () => {
    vi.useFakeTimers();
    const store = createStore();
    let userAttempts = 0;
    handle = async (config) => {
      if (config.url?.endsWith("/me")) return fail(config, 500, { message: "Session unavailable." });
      if (++userAttempts < 4) return fail(config, 500, { message: "Try again." });
      return list(config, [user(2)]);
    };
    const request = store.dispatch(userApi.endpoints.getUsers.initiate(params));
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(7000);
    expect((await request.unwrap()).users).toHaveLength(1);
    expect(userAttempts).toBe(4);
    const me = await store.dispatch(authApi.endpoints.getMe.initiate());
    expect(me.error).toMatchObject({ message: "Session unavailable." });
    expect(calls.filter((call) => call.url?.endsWith("/me"))).toHaveLength(1);
  });

  it("clears every private cache and prevents an old in-flight response restoring it after a session reset", async () => {
    const store = createStore();
    const older = deferred<Response>();
    let sessionId = 1;
    handle = async (config) => {
      if (config.url?.endsWith("/users")) return older.promise;
      if (config.url?.endsWith("/roles")) return response(config, envelope([role]));
      return response(config, envelope({ ...session, id: sessionId }));
    };
    await store.dispatch(authApi.endpoints.getMe.initiate()).unwrap();
    await store.dispatch(roleApi.endpoints.getRoles.initiate()).unwrap();
    const oldRequest = store.dispatch(userApi.endpoints.getUsers.initiate(params));
    await vi.waitFor(() => expect(calls.some((call) => call.url?.endsWith("/users"))).toBe(true));
    store.dispatch(cmsApi.util.resetApiState());
    expect(Object.keys(store.getState().cmsApi.queries)).toHaveLength(0);
    sessionId = 9;
    await store.dispatch(authApi.endpoints.getMe.initiate()).unwrap();
    older.resolve(list(calls.find((call) => call.url?.endsWith("/users"))!, [user(2)]));
    await oldRequest;
    expect(userApi.endpoints.getUsers.select(params)(store.getState()).isUninitialized).toBe(true);
    expect(roleApi.endpoints.getRoles.select()(store.getState()).isUninitialized).toBe(true);
    expect(authApi.endpoints.getMe.select()(store.getState()).data?.id).toBe(9);
  });
});


describe("Fetch transport compatibility", () => {
  it("preserves token types, JSON headers, and reserved characters in filters", async () => {
    const store = createStore();
    saveAuth("custom-token", session, "Token");
    handle = async (config) => list(config, [user(2)]);
    const search = "A+B & C?/# [é]";
    await store.dispatch(userApi.endpoints.getUsers.initiate({ ...params, search: "  " + search + "  " })).unwrap();
    expect(calls[0].params.search).toBe(search);
    expect(calls[0].headers.get("Authorization")).toBe("Token custom-token");
    expect(calls[0].headers.get("Accept")).toBe("application/json");
    expect(calls[0].headers.get("Content-Type")).toBe("application/json");
  });

  it.each(["login", "forgotPassword", "verifyOtp", "resetPassword"] as const)(
    "retains an existing session when the public %s endpoint returns 401", async (endpoint) => {
      const store = createStore();
      const unauthorized = vi.fn();
      setUnauthorizedHandler(unauthorized);
      handle = async (config) => fail(config, 401, { message: "Invalid credentials." });
      if (endpoint === "login") await store.dispatch(authApi.endpoints.login.initiate({ email: "test@example.test", password: "fixture" }));
      else if (endpoint === "forgotPassword") await store.dispatch(authApi.endpoints.forgotPassword.initiate("test@example.test"));
      else if (endpoint === "verifyOtp") await store.dispatch(authApi.endpoints.verifyOtp.initiate({ email: "test@example.test", otp: "123456" }));
      else await store.dispatch(authApi.endpoints.resetPassword.initiate({
        email: "test@example.test", otp: "123456", password: "fixture", password_confirmation: "fixture",
      }));
      expect(getAccessToken()).toBe("synthetic-test-token");
      expect(unauthorized).not.toHaveBeenCalled();
      expect(calls).toHaveLength(1);
    },
  );

  it("clears a protected session on 401 even when the error body is not JSON", async () => {
    const store = createStore();
    const unauthorized = vi.fn();
    setUnauthorizedHandler(unauthorized);
    handle = async () => new Response("<html>Unauthorized</html>", { status: 401, headers: { "Content-Type": "text/html" } });
    const result = await store.dispatch(authApi.endpoints.getMe.initiate());
    expect(result.error).toMatchObject({ kind: ApiErrorKind.Http, status: 401 });
    expect(getAccessToken()).toBeNull();
    expect(unauthorized).toHaveBeenCalledOnce();
    expect(calls).toHaveLength(1);
  });

  it("rejects unsuccessful or incomplete 200 envelopes and keeps the query retry policy", async () => {
    vi.useFakeTimers();
    const store = createStore();
    handle = async (config) => response(config, { success: true, data: [] });
    const request = store.dispatch(userApi.endpoints.getUsers.initiate(params));
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(7000);
    expect((await request).error).toMatchObject({ kind: ApiErrorKind.Application, message: "Could not load users." });
    expect(calls).toHaveLength(4);
    handle = async (config) => response(config, { success: false, message: "Creation rejected." });
    const result = await store.dispatch(userApi.endpoints.createUser.initiate(payload));
    expect(result.error).toMatchObject({ kind: ApiErrorKind.Application, message: "Creation rejected." });
    expect(calls).toHaveLength(5);
  });

  it("returns readable network and malformed JSON errors without retrying a mutation", async () => {
    const store = createStore();
    handle = async () => { throw new TypeError("Failed to fetch"); };
    const network = await store.dispatch(userApi.endpoints.createUser.initiate(payload));
    expect(network.error).toMatchObject({ kind: ApiErrorKind.Network, message: "Cannot reach the server. Check that the API is running." });
    handle = async () => new Response("{broken", { headers: { "Content-Type": "application/json" } });
    const malformed = await store.dispatch(userApi.endpoints.createUser.initiate(payload));
    expect(malformed.error).toMatchObject({ kind: ApiErrorKind.Http, status: 200, message: "The server returned an invalid response." });
    expect(calls).toHaveLength(2);
  });

  it("keeps logout and delete requests bodyless and preserves trimmed auth payloads", async () => {
    const store = createStore();
    handle = async (config) => response(config, envelope(null, "  Done.  "));
    expect(await store.dispatch(authApi.endpoints.forgotPassword.initiate("  test@example.test  ")).unwrap()).toBe("Done.");
    expect(JSON.parse(calls[0].data)).toEqual({ email: "test@example.test" });
    expect(await store.dispatch(authApi.endpoints.logout.initiate()).unwrap()).toBe("Done.");
    expect(await store.dispatch(userApi.endpoints.deleteUser.initiate(2)).unwrap()).toBe("Done.");
    expect(await store.dispatch(roleApi.endpoints.deleteRole.initiate(5)).unwrap()).toBe("Done.");
    expect(calls.slice(1).map((call) => call.data)).toEqual(["", "", ""]);
    expect(calls.slice(1).map((call) => call.method)).toEqual(["post", "delete", "delete"]);
  });
});
