import { z } from "zod";
import { emailSchema } from "@/utils/validators";

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const resetEmailSchema = z.object({ email: emailSchema });

export const otpSchema = z.object({
  otp: z.string().refine((value) => /^\d{6}$/.test(value.replace(/\D/g, "")), "Enter the 6-digit code."),
});

export const setPasswordSchema = z.object({
  password: z.string().min(1, "Enter a new password."),
  password_confirmation: z.string().min(1, "Confirm your password."),
}).refine((value) => !value.password_confirmation || value.password_confirmation === value.password, {
  message: "Passwords do not match.",
  path: ["password_confirmation"],
});
