import { z } from "zod";
import { isRecord } from "@/utils/apiError";
import { requiredText } from "@/utils/validators";
import { recordStatuses } from "@/constants/recordStatus";
import type { OpeningHours } from "./branchTypes";

const branchCode = z.string().superRefine((value, context) => {
  const code = value.trim();
  if (!code) {
    context.addIssue({ code: "custom", message: "Enter a code." });
    return;
  }
  if (code.length > 50) {
    context.addIssue({ code: "custom", message: "Code must be 50 characters or fewer." });
    return;
  }
  if (!/^[A-Za-z0-9_-]+$/.test(code)) {
    context.addIssue({ code: "custom", message: "Use letters, numbers, hyphens, or underscores." });
  }
});

function limitedText(requiredMessage: string, max: number, maxMessage: string) {
  return requiredText(requiredMessage).refine((value) => value.trim().length <= max, maxMessage);
}

function optionalLimited(max: number, maxMessage: string) {
  return z.string().refine((value) => value.trim().length <= max, maxMessage);
}

function optionalEmail() {
  return z.string().superRefine((value, context) => {
    const email = value.trim();
    if (!email) return;
    if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      context.addIssue({ code: "custom", message: "Enter a valid email address." });
    }
  });
}

function optionalCoordinate(min: number, max: number, label: string) {
  return z.string().superRefine((value, context) => {
    const raw = value.trim();
    if (!raw) return;
    if (!/^-?\d+(\.\d+)?$/.test(raw)) {
      context.addIssue({ code: "custom", message: `Enter a valid ${label}.` });
      return;
    }
    const number = Number(raw);
    if (number < min || number > max) {
      context.addIssue({ code: "custom", message: `${label} must be between ${min} and ${max}.` });
    }
  });
}

export const branchFormSchema = z.object({
  name: limitedText("Enter a name.", 150, "Name must be 150 characters or fewer."),
  code: branchCode,
  dms_branch_id: optionalLimited(100, "DMS location ID must be 100 characters or fewer."),
  address_line_1: limitedText("Enter an address.", 255, "Address must be 255 characters or fewer."),
  address_line_2: optionalLimited(255, "Address line 2 must be 255 characters or fewer."),
  city: limitedText("Enter a city.", 100, "City must be 100 characters or fewer."),
  phone: optionalLimited(30, "Phone must be 30 characters or fewer."),
  email: optionalEmail(),
  latitude: optionalCoordinate(-90, 90, "Latitude"),
  longitude: optionalCoordinate(-180, 180, "Longitude"),
  saturday_wednesday: z.string(),
  thursday: z.string(),
  friday: z.string(),
  status: z.enum(recordStatuses),
});

export type BranchFormValues = z.infer<typeof branchFormSchema>;

export const emptyBranchForm: BranchFormValues = {
  name: "",
  code: "",
  dms_branch_id: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  phone: "",
  email: "",
  latitude: "",
  longitude: "",
  saturday_wednesday: "",
  thursday: "",
  friday: "",
  status: "active",
};

export type ExtraHour = { key: string; value: string };

const standardHourKeys = ["saturday_wednesday", "thursday", "friday"] as const;

function readOpeningHours(hours: unknown): OpeningHours | null {
  let value = hours;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      value = JSON.parse(trimmed) as unknown;
    } catch {
      return null;
    }
  }
  if (!isRecord(value)) return null;
  const result: OpeningHours = {};
  for (const [key, entry] of Object.entries(value)) {
    if (key.trim() && typeof entry === "string") result[key] = entry;
  }
  return Object.keys(result).length > 0 ? result : null;
}

export function splitOpeningHours(hours: unknown) {
  const standard = {
    saturday_wednesday: "",
    thursday: "",
    friday: "",
  };
  const extra: ExtraHour[] = [];
  const record = readOpeningHours(hours);
  if (!record) return { standard, extra };
  for (const [key, value] of Object.entries(record)) {
    if ((standardHourKeys as readonly string[]).includes(key)) {
      standard[key as keyof typeof standard] = value;
    } else {
      extra.push({ key, value });
    }
  }
  return { standard, extra };
}
