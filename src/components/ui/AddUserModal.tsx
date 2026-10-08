import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchRoles, roleKeys } from "../../services/roleService";
import { createUser, userKeys } from "../../services/userService";
import type { UserStatus } from "../../types/user";
import { getApiErrorMessage } from "../../utils/apiError";
import Button from "./Button";
import Input from "./Input";
import Modal from "./Modal";
import Select from "./Select";
import { Field } from "./modelControls";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  roleId: "",
  status: "active" as UserStatus,
};

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

type FormState = typeof emptyForm;
type FormErrors = Partial<Record<keyof FormState, string>>;

type AddUserModalProps = {
  open: boolean;
  onClose: () => void;
};

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.firstName.trim()) errors.firstName = "Enter a first name.";
  if (!form.lastName.trim()) errors.lastName = "Enter a last name.";
  if (!emailPattern.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (!form.password) errors.password = "Enter a password.";
  else if (form.password.length < 8) errors.password = "Use at least 8 characters.";
  if (form.confirmPassword !== form.password) errors.confirmPassword = "Passwords do not match.";
  if (!form.roleId) errors.roleId = "Choose a role.";
  return errors;
}

export default function AddUserModal({ open, onClose }: AddUserModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const rolesQuery = useQuery({
    queryKey: roleKeys.all,
    queryFn: fetchRoles,
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async (result) => {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: userKeys.all });
      onClose();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not create the user."));
    },
  });

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    setErrors({});
  }, [open]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    createMutation.mutate({
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      email: form.email.trim(),
      password: form.password,
      password_confirmation: form.confirmPassword,
      role_id: Number(form.roleId),
      status: form.status === "inactive" ? "inactive" : "active",
    });
  }

  const roleOptions = (rolesQuery.data ?? []).map((role) => ({
    value: String(role.id),
    label: role.name,
  }));

  return (
    <Modal open={open} title="Add User" description="Add information below." onClose={onClose} size="md" align="center" compact>
      <form onSubmit={submit} className="grid gap-2 [&_input]:h-8 [&_label]:gap-0.5 [&_select]:h-8" noValidate>
        <Field label="First name" error={errors.firstName}>
          <Input
            name="first_name"
            autoComplete="given-name"
            value={form.firstName}
            placeholder="Enter first name"
            disabled={createMutation.isPending}
            onChange={(value) => update("firstName", value)}
          />
        </Field>
        <Field label="Last name" error={errors.lastName}>
          <Input
            name="last_name"
            autoComplete="family-name"
            value={form.lastName}
            placeholder="Enter last name"
            disabled={createMutation.isPending}
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
            disabled={createMutation.isPending}
            onChange={(value) => update("email", value)}
          />
        </Field>
        <Field label="Password" error={errors.password}>
          <Input
            name="password"
            type="password"
            revealable
            autoComplete="new-password"
            value={form.password}
            placeholder="Enter password"
            disabled={createMutation.isPending}
            onChange={(value) => update("password", value)}
          />
        </Field>
        <Field label="Confirm password" error={errors.confirmPassword}>
          <Input
            name="password_confirmation"
            type="password"
            revealable
            autoComplete="new-password"
            value={form.confirmPassword}
            placeholder="Enter password"
            disabled={createMutation.isPending}
            onChange={(value) => update("confirmPassword", value)}
          />
        </Field>
        <Field label="Role" error={errors.roleId ?? (rolesQuery.isError ? "Could not load roles." : undefined)}>
          <Select
            name="role_id"
            value={form.roleId}
            placeholder="Enter role"
            options={roleOptions}
            disabled={createMutation.isPending || rolesQuery.isPending}
            onChange={(value) => update("roleId", value)}
          />
        </Field>
        <Field label="Status">
          <Select
            name="status"
            value={form.status}
            options={statusOptions}
            disabled={createMutation.isPending}
            onChange={(value) => update("status", value === "inactive" ? "inactive" : "active")}
          />
        </Field>
        <Button variant="primary" type="submit" width="100%" height={34} disabled={createMutation.isPending}>
          {createMutation.isPending ? "Saving..." : "Submit"}
        </Button>
      </form>
    </Modal>
  );
}
