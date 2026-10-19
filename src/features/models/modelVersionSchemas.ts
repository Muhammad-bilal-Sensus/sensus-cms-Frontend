import { z } from "zod";
import { requiredText } from "@/utils/validators";
import { modelCodeFromName } from "./vehicleModelSchemas";
import { modelStatuses } from "./vehicleModelTypes";

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export function versionCode(modelCode: string, name: string, year: string) {
  return [modelCode.trim(), modelCodeFromName(name), year.trim()].filter(Boolean).join("-").slice(0, 100);
}

export function versionSections(sections: { key: string; title: string; body: string }[]) {
  const next = sections.flatMap((section) => {
    const key = section.key.trim();
    const title = section.title.trim();
    const body = section.body.trim();
    if (!key && !title && !body) return [];
    return [{ key, title, body }];
  });
  return next.length > 0 ? next : null;
}

export const versionFormSchema = z.object({
  name: requiredText("Enter a variant name.")
    .refine((value) => value.trim().length <= 200, "Use 200 characters or fewer.")
    .refine((value) => modelCodeFromName(value).length > 0, "Enter a name with letters or numbers."),
  modelYear: z.string().refine((value) => {
    const year = Number(value);
    return Number.isInteger(year) && year >= 1900 && year <= 2100;
  }, "Enter a model year from 1900 to 2100."),
  launchDate: z.string(),
  endDate: z.string(),
  sections: z.array(z.object({
    key: z.string(),
    title: z.string(),
    body: z.string(),
  })),
  status: z.enum(modelStatuses),
}).superRefine((value, context) => {
  if (value.launchDate && !isoDate.test(value.launchDate)) {
    context.addIssue({ code: "custom", path: ["launchDate"], message: "Enter a launch date." });
  }
  if (value.endDate && !isoDate.test(value.endDate)) {
    context.addIssue({ code: "custom", path: ["endDate"], message: "Enter an end date." });
  }
  if (value.launchDate && value.endDate && isoDate.test(value.launchDate) && isoDate.test(value.endDate) && value.endDate < value.launchDate) {
    context.addIssue({ code: "custom", path: ["endDate"], message: "End date must be on or after the launch date." });
  }
  const seenKeys = new Set<string>();
  value.sections.forEach((section, index) => {
    const key = section.key.trim();
    const title = section.title.trim();
    const body = section.body.trim();
    if (!key && !title && !body) return;
    if (!key) {
      context.addIssue({ code: "custom", path: ["sections", index, "key"], message: "Enter a section key." });
    } else if (!/^[a-z0-9_]+$/.test(key)) {
      context.addIssue({ code: "custom", path: ["sections", index, "key"], message: "Use lowercase letters, numbers, and underscores." });
    } else if (seenKeys.has(key)) {
      context.addIssue({ code: "custom", path: ["sections", index, "key"], message: "This key is already used on this variant." });
    } else {
      seenKeys.add(key);
    }
    if (!title) {
      context.addIssue({ code: "custom", path: ["sections", index, "title"], message: "Enter a section title." });
    }
  });
});

export type VersionFormValues = z.infer<typeof versionFormSchema>;

export const emptyVersionForm: VersionFormValues = {
  name: "",
  modelYear: String(new Date().getFullYear()),
  launchDate: "",
  endDate: "",
  sections: [],
  status: "draft",
};
