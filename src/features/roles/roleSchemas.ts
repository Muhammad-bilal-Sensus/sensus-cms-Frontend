import { z } from "zod";
import { requiredText } from "@/utils/validators";
import { roleCodeFromName } from "./roleCode";

export function roleFormSchema(existingCode?: string) {
  return z.object({
    name: requiredText("Enter a role name.").refine(
      (value) => !value.trim() || Boolean(existingCode ?? roleCodeFromName(value)),
      "Enter a role name that can be turned into a code.",
    ),
    description: z.string(),
    permissionIds: z.array(z.number()),
  });
}

export type RoleFormValues = z.infer<ReturnType<typeof roleFormSchema>>;
