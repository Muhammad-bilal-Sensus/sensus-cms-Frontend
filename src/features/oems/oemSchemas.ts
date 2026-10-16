import { z } from "zod";
import { requiredText } from "@/utils/validators";
import { oemCodeFromName } from "./oemCode";
import { oemStatuses } from "./oemTypes";

const oemCode = z.string().superRefine((value, context) => {
  const code = value.trim();
  if (!code) {
    context.addIssue({ code: "custom", message: "Enter a code." });
    return;
  }
  if (!/^[A-Za-z0-9_-]+$/.test(code)) {
    context.addIssue({ code: "custom", message: "Use letters, numbers, hyphens, or underscores." });
  }
});

export const oemFormSchema = z.object({
  name: requiredText("Enter a name.").refine(
    (value) => value.trim().length === 0 || Boolean(oemCodeFromName(value)),
    "Enter a name that can be turned into a code.",
  ),
  code: oemCode,
  description: z.string(),
  status: z.enum(oemStatuses),
});

export type OemFormValues = z.infer<typeof oemFormSchema>;

export const emptyOemForm: OemFormValues = {
  name: "",
  code: "",
  description: "",
  status: "active",
};
