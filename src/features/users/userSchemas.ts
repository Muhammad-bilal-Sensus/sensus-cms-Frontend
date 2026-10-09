import { z } from "zod";
import { emailSchema, requiredText } from "@/utils/validators";

const userFields = {
  firstName: requiredText("Enter a first name."),
  lastName: requiredText("Enter a last name."),
  email: emailSchema,
  password: z.string(),
  confirmPassword: z.string(),
  roleId: z.string().min(1, "Choose a role."),
  status: z.enum(["active", "inactive", "suspended"]),
};

export const createUserSchema = z.object(userFields).superRefine((value, context) => {
  if (!value.password) {
    context.addIssue({ code: "custom", path: ["password"], message: "Enter a password." });
  } else if (value.password.length < 8) {
    context.addIssue({ code: "custom", path: ["password"], message: "Use at least 8 characters." });
  }
  if (value.confirmPassword !== value.password) {
    context.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match." });
  }
});

export const editUserSchema = z.object(userFields).superRefine((value, context) => {
  if (!value.password && !value.confirmPassword) return;
  if (value.password.length < 8) {
    context.addIssue({ code: "custom", path: ["password"], message: "Use at least 8 characters." });
  }
  if (value.confirmPassword !== value.password) {
    context.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match." });
  }
});

export type UserFormValues = z.infer<typeof createUserSchema>;

export const emptyUserForm: UserFormValues = {
  firstName: "", lastName: "", email: "", password: "", confirmPassword: "", roleId: "", status: "active",
};
