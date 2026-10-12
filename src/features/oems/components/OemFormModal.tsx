import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCreateOemMutation, useGetOemQuery, useUpdateOemMutation } from "@/redux/api/oemApi";
import { useWaitForQueryRefresh } from "@/redux/store/queryRefresh";
import { getApiErrorMessage } from "@/utils/apiError";
import Button, { ButtonVariant } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import ModalBox from "@/components/ui/ModalBox";
import { ModalAlign, ModalSize } from "@/components/ui/Modal";
import { FormInput, FormSelect, FormTextarea } from "@/components/form/FormControls";
import { useSchemaForm } from "@/hooks/useSchemaForm";
import { oemCodeFromName } from "../oemCode";
import { emptyOemForm, oemFormSchema, type OemFormValues } from "../oemSchemas";
import { oemStatusOptions, toOemStatus, type CmsOem, type OemPayload } from "../oemTypes";

const OemField = {
  name: "name",
  code: "code",
  description: "description",
  status: "status",
} as const;

const OemFormText = {
  addTitle: "Add OEM",
  editTitle: "Edit OEM",
  addDescription: "Add a manufacturer below.",
  editDescription: "Update the manufacturer below.",
  loadError: "Could not load the OEM.",
  createError: "Could not create the OEM.",
  updateError: "Could not update the OEM.",
  loading: "Loading OEM",
  name: "Name",
  code: "Code",
  description: "Description",
  status: "Status",
  namePlaceholder: "Enter name",
  codePlaceholder: "Enter code",
  descriptionPlaceholder: "Enter description",
  saving: "Saving...",
  submit: "Submit",
} as const;

type OemFormModalProps = {
  open: boolean;
  oemId: number | null;
  onClose: () => void;
};

function formFromOem(oem: CmsOem): OemFormValues {
  return {
    name: oem.name ?? "",
    code: oem.code ?? "",
    description: oem.description ?? "",
    status: toOemStatus(oem.status),
  };
}

function toPayload(values: OemFormValues, generateCode: boolean): OemPayload {
  return {
    name: values.name.trim(),
    code: generateCode ? oemCodeFromName(values.name) : values.code.trim(),
    description: values.description.trim(),
    status: values.status,
  };
}

export default function OemFormModal({ open, oemId, onClose }: OemFormModalProps) {
  const editing = oemId !== null;
  const waitForRefresh = useWaitForQueryRefresh();
  const [createOem, createMutation] = useCreateOemMutation();
  const [updateOem, updateMutation] = useUpdateOemMutation();
  const [refreshing, setRefreshing] = useState(false);
  const form = useSchemaForm(oemFormSchema, emptyOemForm);
  const { reset, formState: { errors, isSubmitting } } = form;
  const detailQuery = useGetOemQuery(oemId ?? 0, { skip: !open || !editing });
  const isSaving = createMutation.isLoading || updateMutation.isLoading || refreshing || isSubmitting;
  const isLoadingDetail = editing && (detailQuery.isLoading || detailQuery.isFetching) && !detailQuery.data;

  useEffect(() => {
    if (!open) return;
    if (!editing) {
      reset(emptyOemForm);
      return;
    }
    if (detailQuery.data && detailQuery.data.id === oemId) reset(formFromOem(detailQuery.data));
  }, [detailQuery.data, editing, oemId, open, reset]);

  async function submit(values: OemFormValues) {
    if (isSaving || isLoadingDetail) return;
    try {
      const payload = toPayload(values, oemId === null);
      const result = oemId === null
        ? await createOem(payload).unwrap()
        : await updateOem({ id: oemId, payload }).unwrap();
      setRefreshing(true);
      toast.success(result.message);
      await waitForRefresh();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, editing ? OemFormText.updateError : OemFormText.createError));
    } finally {
      setRefreshing(false);
    }
  }

  const detailError = detailQuery.isError ? getApiErrorMessage(detailQuery.error, OemFormText.loadError) : null;

  return (
    <ModalBox
      open={open}
      title={editing ? OemFormText.editTitle : OemFormText.addTitle}
      description={editing ? OemFormText.editDescription : OemFormText.addDescription}
      onClose={onClose}
      size={ModalSize.md}
      align={ModalAlign.center}
    >
      {isLoadingDetail ? (
        <div className="flex items-center justify-center gap-3 py-8 text-sm text-slate-600">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-teal-700" />
          {OemFormText.loading}
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            if (oemId === null) form.setValue("code", oemCodeFromName(form.getValues("name")));
            void form.submitForm(submit)(event);
          }}
          className="grid gap-2 [&_input]:h-8 [&_label]:gap-0.5 [&_select]:h-8"
          noValidate
        >
          {detailError ? <p className="text-sm text-rose-600">{detailError}</p> : null}
          <Field label={OemFormText.name} error={errors.name?.message}>
            <FormInput form={form} name={OemField.name} htmlName={OemField.name} placeholder={OemFormText.namePlaceholder} disabled={isSaving} />
          </Field>
          <Field label={OemFormText.code} error={errors.code?.message}>
            <FormInput
              form={form}
              name={OemField.code}
              htmlName={OemField.code}
              placeholder={OemFormText.codePlaceholder}
              transform={(value) => value.toUpperCase()}
              disabled={isSaving}
            />
          </Field>
          <Field label={OemFormText.description} error={errors.description?.message}>
            <FormTextarea form={form} name={OemField.description} htmlName={OemField.description} placeholder={OemFormText.descriptionPlaceholder} rows={3} disabled={isSaving} />
          </Field>
          <Field label={OemFormText.status}>
            <FormSelect form={form} name={OemField.status} htmlName={OemField.status} options={oemStatusOptions} disabled={isSaving} />
          </Field>
          <Button variant={ButtonVariant.primary} type="submit" width="100%" height={34} disabled={isSaving || Boolean(detailError)}>
            {isSaving ? OemFormText.saving : OemFormText.submit}
          </Button>
        </form>
      )}
    </ModalBox>
  );
}
