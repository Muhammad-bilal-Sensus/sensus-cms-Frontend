import type { FieldErrors, FieldValues } from "react-hook-form";

export function getFormError<T extends FieldValues>(errors: FieldErrors<T>): string | undefined {
  return Object.values(errors)
    .map((error) => typeof error?.message === "string" ? error.message : undefined)
    .find((message) => Boolean(message));
}
