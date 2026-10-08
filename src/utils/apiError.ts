import axios from "axios";

type ErrorBody = {
  message?: string;
  errors?: Record<string, string[] | string>;
};

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (axios.isAxiosError<ErrorBody>(error)) {
    const data = error.response?.data;
    if (typeof data?.message === "string" && data.message.trim()) return data.message;

    if (data?.errors) {
      for (const value of Object.values(data.errors)) {
        if (Array.isArray(value) && value[0]) return value[0];
        if (typeof value === "string" && value.trim()) return value;
      }
    }

    if (!error.response) return "Cannot reach the server. Check that the API is running.";
    if (error.response.status === 401) return "Invalid email or password.";
  }

  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}
