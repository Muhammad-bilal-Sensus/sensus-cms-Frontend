import type { ApiErrorKind } from "./constants";

export type ApiError = {
  kind: ApiErrorKind;
  message: string;
  status?: number;
  roleId?: number;
};

export type ApiQueryOptions = {
  maxRetries?: number;
  fallbackMessage?: string;
};
