import { z } from "zod";
import { requiredText } from "@/utils/validators";

export const MAX_PICTURE_BYTES = 10 * 1024 * 1024;
export const PICTURE_MIME_TYPES = ["image/jpeg", "image/png", "image/svg+xml"] as const;

export const profileSchema = z.object({
  name: requiredText("Enter your name."),
  picture: z.string().optional(),
  city: z.string(),
  timeZone: z.string(),
  language: z.string(),
});

export const profilePictureSchema = z.object({
  type: z.string().refine((value) => PICTURE_MIME_TYPES.some((type) => type === value), "Use a JPG, PNG, or SVG file."),
  size: z.number().max(MAX_PICTURE_BYTES, "Picture must be 10 MB or smaller."),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
