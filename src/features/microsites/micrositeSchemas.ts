import { z } from "zod";
import { oemStatuses } from "@/features/oems/oemTypes";
import { emailSchema, requiredText } from "@/utils/validators";

const micrositeSlug = z.string().superRefine((value, context) => {
  const slug = value.trim();
  if (!slug) {
    context.addIssue({ code: "custom", message: "Enter a slug." });
    return;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    context.addIssue({ code: "custom", message: "Use lowercase letters, numbers, and hyphens." });
  }
});

export const micrositeFormSchema = z.object({
  name: requiredText("Enter a name."),
  slug: micrositeSlug,
  domain: requiredText("Enter a domain."),
  locale: requiredText("Enter a locale."),
  fallbackLocale: requiredText("Enter a fallback locale."),
  currency: requiredText("Enter a currency."),
  contactEmail: emailSchema,
  status: z.enum(oemStatuses),
});

export type MicrositeFormValues = z.infer<typeof micrositeFormSchema>;

export const emptyMicrositeForm: MicrositeFormValues = {
  name: "",
  slug: "",
  domain: "",
  locale: "",
  fallbackLocale: "",
  currency: "",
  contactEmail: "",
  status: "active",
};
