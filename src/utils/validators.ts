import { z } from "zod";

// Preserve the email format accepted by the existing forms.
export const emailSchema = z.string().refine(
  (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
  "Enter a valid email address.",
);

export function requiredText(message: string) {
  return z.string().refine((value) => value.trim().length > 0, message);
}
