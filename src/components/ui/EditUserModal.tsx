import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchRoles, roleKeys } from "../../services/roleService";
import { updateUser, userKeys } from "../../services/userService";
import type { CmsUser, UserStatus } from "../../types/user";
import { getApiErrorMessage } from "../../utils/apiError";
import Button from "./Button";
import Input from "./Input";
import Modal from "./Modal";
import Select from "./Select";
import { Field } from "./modelControls";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  roleId: string;
  status: UserStatus;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

type EditUserModalProps = {
  user: CmsUser | null;
  onClose: () => void;
};

function toStatus(value: string): UserStatus {
  if (value === "inactive" || value === "suspended") return value;
  return "active";
}

function formFromUser(user: CmsUser): FormState {
  return {
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    password: "",
    confirmPassword: "",
    roleId: user.role?.id ? String(user.role.id) : "",
    status: toStatus(user.status),
  };
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.firstName.trim()) errors.firstName = "Enter a first name.";
  if (!form.lastName.trim()) errors.lastName = "Enter a last name.";
  if (!emailPattern.test(form.email.trim())) errors.email = "Enter a valid email address.";
  const changingPassword = form.password.length > 0 || form.confirmPassword.length > 0;
  if (changingPassword) {
    if (form.password.length < 8) errors.password = "Use at least 8 characters.";
    if (form.confirmPassword !== form.password) errors.confirmPassword = "Passwords do not match.";
  }
  if (!form.roleId) errors.roleId = "Choose a role.";
  return errors;
}

export default function EditUserModal({ user, onClose }: EditUserModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [syncedUserId, setSyncedUserId] = useState<number | null>(null);

  if (user && syncedUserId !== user.id) {
    setSyncedUserId(user.id);
    setForm(formFromUser(user));
    setErrors({});
  }

  const rolesQuery = useQuery({
    queryKey: roleKeys.all,
    queryFn: fetchRoles,
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: FormState) => {
      if (!user) throw new Error("Choose a user to edit.");
      return updateUser(user.id, {
        first_name: payload.firstName.trim(),
        last_name: payload.lastName.trim(),
        email: payload.email.trim(),
        status: payload.status,
        role_id: Number(payload.roleId),
        password: payload.password,
        password_confirmation: payload.confirmPassword,
      });
    },
    onSuccess: async (result) => {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: userKeys.all });
      onClose();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not update the user."));
    },
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    updateMutation.mutate(form);
  }

  const roleOptions = (rolesQuery.data ?? []).map((role) => ({
    value: String(role.id),
    label: role.name,
  }));

  return (
    <Modal
      open={Boolean(user)}
      title="Edit User"
      description="Update the account below. Leave the password blank to keep it."
      onClose={onClose}
      size="md"
      align="center"
      compact
    >
      {form ? (
        <form onSubmit={submit} className="grid gap-2 [&_input]:h-8 [&_label]:gap-0.5 [&_select]:h-8" noValidate>
          <Field label="First name" error={errors.firstName}>
            <Input
              name="first_name"
              autoComplete="given-name"
              value={form.firstName}
              placeholder="Enter first name"
              disabled={updateMutation.isPending}
              onChange={(value) => update("firstName", value)}
            />
          </Field>
          <Field label="Last name" error={errors.lastName}>
            <Input
              name="last_name"
              autoComplete="family-name"
              value={form.lastName}
              placeholder="Enter last name"
              disabled={updateMutation.isPending}
              onChange={(value) => update("lastName", value)}
            />
          </Field>
          <Field label="Email" error={errors.email}>
            <Input
              name="email"
              type="email"
              autoComplete="off"
              value={form.email}
              placeholder="Enter email"
              disabled={updateMutation.isPending}
              onChange={(value) => update("email", value)}
            />
          </Field>
          <Field label="Password" hint="Optional. Fill this only to change the password." error={errors.password}>
            <Input
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              placeholder="Enter password"
              disabled={updateMutation.isPending}
              onChange={(value) => update("password", value)}
            />
          </Field>
          <Field label="Confirm password" error={errors.confirmPassword}>
            <Input
              name="password_confirmation"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              placeholder="Enter password"
              disabled={updateMutation.isPending}
              onChange={(value) => update("confirmPassword", value)}
            />
          </Field>
          <Field label="Role" error={errors.roleId ?? (rolesQuery.isError ? "Could not load roles." : undefined)}>
            <Select
              name="role_id"
              value={form.roleId}
              placeholder="Enter role"
              options={roleOptions}
              disabled={updateMutation.isPending || rolesQuery.isPending}
              onChange={(value) => update("roleId", value)}
            />
          </Field>
          <Field label="Status">
            <Select
              name="status"
              value={form.status}
              options={statusOptions}
              disabled={updateMutation.isPending}
              onChange={(value) => update("status", toStatus(value))}
            />
          </Field>
          <Button variant="primary" type="submit" width="100%" height={34} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Submit"}
          </Button>
        </form>
      ) : null}
    </Modal>
  );
}
