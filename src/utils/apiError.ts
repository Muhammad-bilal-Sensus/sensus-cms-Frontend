export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function getResponseErrorMessage(body: unknown): string | undefined {
  if (!isRecord(body)) return undefined;
  if (typeof body.message === "string" && body.message.trim()) return body.message;
  if (isRecord(body.errors)) {
    for (const value of Object.values(body.errors)) {
      if (Array.isArray(value) && typeof value[0] === "string" && value[0]) return value[0];
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  return undefined;
}

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (isRecord(error) && typeof error.message === "string" && error.message.trim()) return error.message;
  return fallback;
}
