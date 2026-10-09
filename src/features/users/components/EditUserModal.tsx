import { useEffect, useState } from "react";
import { useUpdateUserMutation } from "@/redux/api/userApi";
import { useGetRolesQuery } from "@/redux/api/roleApi";
import { REFERENCE_DATA_FRESH_SECONDS } from "@/redux/constants";
import { useWaitForQueryRefresh } from "@/redux/store/queryRefresh";
import { useStaleRefetch } from "@/redux/store/useStaleRefetch";
import { toast } from "sonner";
import type { CmsUser, UserStatus } from "../userTypes";
import { getApiErrorMessage } from "@/utils/apiError";
import Button from "@/components/ui/Button";
import { FormInput, FormSelect } from "@/components/form/FormControls";
import { useSchemaForm } from "@/hooks/useSchemaForm";
import { editUserSchema, emptyUserForm, type UserFormValues } from "../userSchemas";
import Modal from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

type EditUserModalProps = {
  user: CmsUser | null;
  onClose: () => void;
};

function toStatus(value: string): UserStatus {
  if (value === "inactive" || value === "suspended") return value;
  return "active";
}

function formFromUser(user: CmsUser): UserFormValues {
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

export default function EditUserModal({ user, onClose }: EditUserModalProps) {
  const waitForRefresh = useWaitForQueryRefresh();
  const [updateUser, updateMutation] = useUpdateUserMutation();
  const [refreshing, setRefreshing] = useState(false);
  const form = useSchemaForm(editUserSchema, emptyUserForm);
  const { reset, formState: { errors, isSubmitting } } = form;
  const isSaving = updateMutation.isLoading || refreshing || isSubmitting;

  useEffect(() => {
    reset(user ? formFromUser(user) : emptyUserForm);
  }, [user, reset]);

  const rolesQuery = useGetRolesQuery(undefined, {
    skip: !user,
    refetchOnMountOrArgChange: REFERENCE_DATA_FRESH_SECONDS,
  });
  useStaleRefetch(rolesQuery, REFERENCE_DATA_FRESH_SECONDS);

  async function saveUser(payload: UserFormValues) {
    try {
      if (!user) throw new Error("Choose a user to edit.");
      const result = await updateUser({ id: user.id, payload: {
        first_name: payload.firstName.trim(),
        last_name: payload.lastName.trim(),
        email: payload.email.trim(),
        status: payload.status,
        role_id: Number(payload.roleId),
        password: payload.password,
        password_confirmation: payload.confirmPassword,
      } }).unwrap();
      setRefreshing(true);
      toast.success(result.message);
      await waitForRefresh();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not update the user."));
    } finally {
      setRefreshing(false);
    }
  }

  async function submit(values: UserFormValues) {
    if (user && !isSaving) await saveUser(values);
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
      {user ? (
        <form onSubmit={form.submitForm(submit)} className="grid gap-2 [&_input]:h-8 [&_label]:gap-0.5 [&_select]:h-8" noValidate>
          <Field label="First name" error={errors.firstName?.message}>
            <FormInput
              form={form}
              name="firstName"
              htmlName="first_name"
              autoComplete="given-name"
              placeholder="Enter first name"
              disabled={isSaving}
            />
          </Field>
          <Field label="Last name" error={errors.lastName?.message}>
            <FormInput
              form={form}
              name="lastName"
              htmlName="last_name"
              autoComplete="family-name"
              placeholder="Enter last name"
              disabled={isSaving}
            />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <FormInput
              form={form}
              name="email"
              htmlName="email"
              type="email"
              autoComplete="off"
              placeholder="Enter email"
              disabled={isSaving}
            />
          </Field>
          <Field label="Password" hint="Optional. Fill this only to change the password." error={errors.password?.message}>
            <FormInput
              form={form}
              name="password"
              htmlName="password"
              type="password"
              revealable
              autoComplete="new-password"
              placeholder="Enter password"
              disabled={isSaving}
            />
          </Field>
          <Field label="Confirm password" error={errors.confirmPassword?.message}>
            <FormInput
              form={form}
              name="confirmPassword"
              htmlName="password_confirmation"
              type="password"
              revealable
              autoComplete="new-password"
              placeholder="Enter password"
              disabled={isSaving}
            />
          </Field>
          <Field label="Role" error={errors.roleId?.message ?? (rolesQuery.isError ? "Could not load roles." : undefined)}>
            <FormSelect
              form={form}
              name="roleId"
              htmlName="role_id"
              placeholder="Enter role"
              options={roleOptions}
              disabled={isSaving || rolesQuery.isLoading || rolesQuery.isUninitialized}
            />
          </Field>
          <Field label="Status">
            <FormSelect
              form={form}
              name="status"
              htmlName="status"
              options={statusOptions}
              disabled={isSaving}
            />
          </Field>
          <Button variant="primary" type="submit" width="100%" height={34} disabled={isSaving}>
            {isSaving ? "Saving..." : "Submit"}
          </Button>
        </form>
      ) : null}
    </Modal>
  );
}
