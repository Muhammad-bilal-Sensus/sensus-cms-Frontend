import { z } from "zod";
import { oemStatuses } from "@/features/oems/oemTypes";
import { requiredText } from "@/utils/validators";

const micrositeSlug = z.string().superRefine((value, context) => {
  const slug = value.trim();
  if (!slug) return;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    context.addIssue({ code: "custom", message: "Use lowercase letters, numbers, and hyphens." });
  }
});

export const micrositeFormSchema = z.object({
  name: requiredText("Enter a name."),
  slug: micrositeSlug,
  domain: requiredText("Enter a domain."),
  status: z.enum(oemStatuses),
});

export type MicrositeFormValues = z.infer<typeof micrositeFormSchema>;

export const emptyMicrositeForm: MicrositeFormValues = {
  name: "",
  slug: "",
  domain: "",
  status: "active",
};
