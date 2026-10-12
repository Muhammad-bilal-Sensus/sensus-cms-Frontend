export enum ApiTag {
  Auth = "Auth",
  Users = "Users",
  Roles = "Roles",
  Permissions = "Permissions",
  Oems = "Oems",
}

export enum ApiErrorKind {
  Http = "http",
  Network = "network",
  Application = "application",
  PermissionSync = "permission-sync",
}

export const QUERY_CACHE_SECONDS = 5 * 60;
export const REFERENCE_DATA_FRESH_SECONDS = 5 * 60;
export const QUERY_RETRY_COUNT = 3;
export const NO_RETRIES = 0;
export const QUERY_RETRY_DELAY_MS = 1000;
export const QUERY_MAX_RETRY_DELAY_MS = 30_000;

export enum HttpMethod {
  Get = "GET",
  Post = "POST",
  Put = "PUT",
  Delete = "DELETE",
}

export enum HttpStatus {
  Unauthorized = 401,
}

export const API_PATH = {
  Login: "/api/cms/v1/login",
  Logout: "/api/cms/v1/logout",
  Me: "/api/cms/v1/me",
  ForgotPassword: "/api/cms/v1/forgot-password",
  VerifyOtp: "/api/cms/v1/verify-otp",
  ResetPassword: "/api/cms/v1/reset-password",
  Users: "/api/cms/v1/users",
  Roles: "/api/cms/v1/roles",
  Permissions: "/api/cms/v1/permissions",
  Oems: "/api/cms/v1/oems",
} as const;

export const PUBLIC_AUTH_ENDPOINTS: readonly string[] = [
  API_PATH.Login, API_PATH.ForgotPassword, API_PATH.VerifyOtp, API_PATH.ResetPassword,
];

export const DEFAULT_API_BASE_URL = "http://localhost:8000";
export const NETWORK_ERROR_MESSAGE = "Cannot reach the server. Check that the API is running.";
