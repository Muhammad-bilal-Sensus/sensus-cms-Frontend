import { useEffect, useState } from "react";
import { useCreateUserMutation } from "@/redux/api/userApi";
import { useGetRolesQuery } from "@/redux/api/roleApi";
import { REFERENCE_DATA_FRESH_SECONDS } from "@/redux/constants";
import { useWaitForQueryRefresh } from "@/redux/store/queryRefresh";
import { useStaleRefetch } from "@/redux/store/useStaleRefetch";
import { toast } from "sonner";
import type { CreateUserPayload } from "../userTypes";
import { getApiErrorMessage } from "@/utils/apiError";
import Button from "@/components/ui/Button";
import { FormInput, FormSelect } from "@/components/form/FormControls";
import { useSchemaForm } from "@/hooks/useSchemaForm";
import { createUserSchema, emptyUserForm, type UserFormValues } from "../userSchemas";
import Modal from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

type AddUserModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function AddUserModal({ open, onClose }: AddUserModalProps) {
  const waitForRefresh = useWaitForQueryRefresh();
  const [createUser, createMutation] = useCreateUserMutation();
  const [refreshing, setRefreshing] = useState(false);
  const form = useSchemaForm(createUserSchema, emptyUserForm);
  const { reset, formState: { errors, isSubmitting } } = form;
  const isSaving = createMutation.isLoading || refreshing || isSubmitting;

  const rolesQuery = useGetRolesQuery(undefined, {
    skip: !open,
    refetchOnMountOrArgChange: REFERENCE_DATA_FRESH_SECONDS,
  });
  useStaleRefetch(rolesQuery, REFERENCE_DATA_FRESH_SECONDS);

  async function saveUser(payload: CreateUserPayload) {
    try {
      const result = await createUser(payload).unwrap();
      setRefreshing(true);
      toast.success(result.message);
      await waitForRefresh();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not create the user."));
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    reset(emptyUserForm);
  }, [open, reset]);

  async function submit(values: UserFormValues) {
    if (isSaving) return;
    await saveUser({
      first_name: values.firstName.trim(),
      last_name: values.lastName.trim(),
      email: values.email.trim(),
      password: values.password,
      password_confirmation: values.confirmPassword,
      role_id: Number(values.roleId),
      status: values.status === "inactive" ? "inactive" : "active",
    });
  }

  const roleOptions = (rolesQuery.data ?? []).map((role) => ({
    value: String(role.id),
    label: role.name,
  }));

  return (
    <Modal open={open} title="Add User" description="Add information below." onClose={onClose} size="md" align="center" compact>
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
        <Field label="Password" error={errors.password?.message}>
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
    </Modal>
  );
}
