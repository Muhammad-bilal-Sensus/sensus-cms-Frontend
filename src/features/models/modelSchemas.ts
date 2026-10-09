import { z } from "zod";
import { requiredText } from "@/utils/validators";
import { sameKey, type CatalogModel, type ModelVersion, type ModelTrim } from "./modelTypes";

export function modelFormSchema(models: CatalogModel[], ignoreId?: string) {
  return z.object({
    oemId: z.string().min(1, "Choose an OEM."),
    name: requiredText("Enter a model name."),
    code: requiredText("Enter a model code."),
    slug: requiredText("Enter a slug."),
    bodyType: z.enum(["suv", "sedan", "pickup", "hatchback", "mpv", "coupe"]),
    status: z.enum(["draft", "published", "inactive"]),
  }).superRefine((draft, context) => {
    if (!draft.oemId || !draft.name.trim() || !draft.code.trim() || !draft.slug.trim()) return;
    const siblings = models.filter((model) => model.oemId === draft.oemId && model.id !== ignoreId);
    if (siblings.some((model) => sameKey(model.code, draft.code))) {
      context.addIssue({ code: "custom", path: ["code"], message: "This code is already used for this OEM." });
    } else if (siblings.some((model) => sameKey(model.slug, draft.slug))) {
      context.addIssue({ code: "custom", path: ["slug"], message: "This slug is already used for this OEM." });
    }
  });
}

export function versionFormSchema(versions: ModelVersion[]) {
  return z.object({
    code: requiredText("Enter a version code."),
    name: requiredText("Enter a version name."),
    modelYear: z.string().refine((value) => {
      const year = Number(value);
      return Number.isInteger(year) && year >= 1980 && year <= 2100;
    }, "Enter a four-digit model year."),
    status: z.enum(["draft", "published", "inactive"]),
  }).superRefine((draft, context) => {
    const year = Number(draft.modelYear);
    if (!draft.code.trim() || !draft.name.trim() || !Number.isInteger(year) || year < 1980 || year > 2100) return;
    if (versions.some((version) => sameKey(version.code, draft.code))) {
      context.addIssue({ code: "custom", path: ["code"], message: "This code is already used on this model." });
    }
  });
}

export function trimFormSchema(trims: ModelTrim[]) {
  return z.object({
    code: requiredText("Enter a trim code."),
    name: requiredText("Enter a trim name."),
    powertrainType: z.enum(["petrol", "diesel", "hybrid", "plug_in_hybrid", "electric"]),
    // Keep existing catalog behavior: a blank preview price represents zero.
    price: z.string().refine((value) => Number.isFinite(Number(value)) && Number(value) >= 0, "Enter the current retail price."),
    currencyCode: z.string().min(1, "Choose a currency."),
    status: z.enum(["draft", "published", "inactive"]),
  }).superRefine((draft, context) => {
    if (!draft.code.trim() || !draft.name.trim() || !Number.isFinite(Number(draft.price)) || Number(draft.price) < 0 || !draft.currencyCode) return;
    if (trims.some((trim) => sameKey(trim.code, draft.code))) {
      context.addIssue({ code: "custom", path: ["code"], message: "This code is already used on this version." });
    }
  });
}

export function schemaError<T>(schema: z.ZodType<T, T>, value: T): string | null {
  const result = schema.safeParse(value);
  return result.success ? null : result.error.issues[0]?.message ?? "Check the form values.";
}
