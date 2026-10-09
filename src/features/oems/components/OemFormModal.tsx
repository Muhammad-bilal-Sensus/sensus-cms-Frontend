import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCreateOemMutation, useGetOemQuery, useUpdateOemMutation } from "@/redux/api/oemApi";
import { useWaitForQueryRefresh } from "@/redux/store/queryRefresh";
import { getApiErrorMessage } from "@/utils/apiError";
import Button from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import Modal from "@/components/ui/Modal";
import { FormInput, FormSelect, FormTextarea } from "@/components/form/FormControls";
import { useSchemaForm } from "@/hooks/useSchemaForm";
import { emptyOemForm, oemFormSchema, type OemFormValues } from "../oemSchemas";
import { oemStatusOptions, toOemStatus, type CmsOem, type OemPayload } from "../oemTypes";

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

function toPayload(values: OemFormValues): OemPayload {
  return {
    name: values.name.trim(),
    code: values.code.trim().toUpperCase(),
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
      const payload = toPayload(values);
      const result = oemId === null
        ? await createOem(payload).unwrap()
        : await updateOem({ id: oemId, payload }).unwrap();
      setRefreshing(true);
      toast.success(result.message);
      await waitForRefresh();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, editing ? "Could not update the OEM." : "Could not create the OEM."));
    } finally {
      setRefreshing(false);
    }
  }

  const detailError = detailQuery.isError ? getApiErrorMessage(detailQuery.error, "Could not load the OEM.") : null;

  return (
    <Modal
      open={open}
      title={editing ? "Edit OEM" : "Add OEM"}
      description={editing ? "Update the manufacturer below." : "Add a manufacturer below."}
      onClose={onClose}
      size="md"
      align="center"
      compact
    >
      {isLoadingDetail ? (
        <div className="flex items-center justify-center gap-3 py-8 text-sm text-slate-600">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-teal-700" />
          Loading OEM
        </div>
      ) : (
        <form onSubmit={form.submitForm(submit)} className="grid gap-2 [&_input]:h-8 [&_label]:gap-0.5 [&_select]:h-8" noValidate>
          {detailError ? <p className="text-sm text-rose-600">{detailError}</p> : null}
          <Field label="Name" error={errors.name?.message}>
            <FormInput form={form} name="name" htmlName="name" placeholder="Enter name" disabled={isSaving} />
          </Field>
          <Field label="Code" error={errors.code?.message}>
            <FormInput
              form={form}
              name="code"
              htmlName="code"
              placeholder="Enter code"
              transform={(value) => value.toUpperCase()}
              disabled={isSaving}
            />
          </Field>
          <Field label="Description" error={errors.description?.message}>
            <FormTextarea form={form} name="description" htmlName="description" placeholder="Enter description" rows={3} disabled={isSaving} />
          </Field>
          <Field label="Status">
            <FormSelect form={form} name="status" htmlName="status" options={oemStatusOptions} disabled={isSaving} />
          </Field>
          <Button variant="primary" type="submit" width="100%" height={34} disabled={isSaving || Boolean(detailError)}>
            {isSaving ? "Saving..." : "Submit"}
          </Button>
        </form>
      )}
    </Modal>
  );
}
