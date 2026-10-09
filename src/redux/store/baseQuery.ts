import { fetchBaseQuery, retry, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError, type FetchBaseQueryMeta } from "@reduxjs/toolkit/query";
import { clearAuth, getAccessToken, getTokenType } from "@/services/authStorage";
import { getResponseErrorMessage } from "@/utils/apiError";
import {
  ApiErrorKind, DEFAULT_API_BASE_URL, HttpStatus, NETWORK_ERROR_MESSAGE,
  PUBLIC_AUTH_ENDPOINTS, QUERY_MAX_RETRY_DELAY_MS, QUERY_RETRY_COUNT, QUERY_RETRY_DELAY_MS,
} from "../constants";
import type { ApiError, ApiQueryOptions } from "../types";

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, ""),
  prepareHeaders: (headers) => {
    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json");
    const token = getAccessToken();
    if (token) headers.set("Authorization", getTokenType() + " " + token);
    return headers;
  },
});

function normalizeError(error: FetchBaseQueryError, fallback?: string): ApiError {
  if (error.status === "FETCH_ERROR" || error.status === "TIMEOUT_ERROR") {
    return { kind: ApiErrorKind.Network, message: NETWORK_ERROR_MESSAGE };
  }
  if (error.status === "PARSING_ERROR") {
    return { kind: ApiErrorKind.Http, status: error.originalStatus, message: "The server returned an invalid response." };
  }
  if (typeof error.status === "number") {
    const applicationError = error.status >= 200 && error.status < 300;
    return {
      kind: applicationError ? ApiErrorKind.Application : ApiErrorKind.Http,
      ...(applicationError ? {} : { status: error.status }),
      message: getResponseErrorMessage(error.data)
        || (applicationError ? fallback || "Something went wrong. Please try again."
          : error.status === HttpStatus.Unauthorized ? "Invalid email or password."
          : "Request failed with status code " + error.status),
    };
  }
  return { kind: ApiErrorKind.Application, message: error.error || fallback || "Something went wrong. Please try again." };
}

const execute: BaseQueryFn<string | FetchArgs, unknown, ApiError, ApiQueryOptions, FetchBaseQueryMeta> = async (args, api, options = {}) => {
  const result = await rawBaseQuery(args, api, options);
  if (!result.error) return result;

  const status = result.error.status === "PARSING_ERROR" ? result.error.originalStatus : result.error.status;
  const url = typeof args === "string" ? args : args.url;
  if (status === HttpStatus.Unauthorized && !PUBLIC_AUTH_ENDPOINTS.includes(url)) {
    clearAuth();
    onUnauthorized?.();
  }
  return { error: normalizeError(result.error, options.fallbackMessage), meta: result.meta };
};

// Retry reads only; mutations and /me opt out through extraOptions.maxRetries.
// Validation failures use validateStatus and follow the same read retry policy.
export const baseQuery = retry(execute, {
  maxRetries: QUERY_RETRY_COUNT,
  backoff: async (attempt) => {
    const delay = Math.min(QUERY_RETRY_DELAY_MS * 2 ** (attempt - 1), QUERY_MAX_RETRY_DELAY_MS);
    await new Promise<void>((resolve) => setTimeout(resolve, delay));
  },
});
