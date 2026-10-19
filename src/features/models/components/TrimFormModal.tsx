import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FormInput, FormSelect, FormTextarea } from "@/components/form/FormControls";
import Button, { ButtonVariant } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { ModalAlign, ModalSize } from "@/components/ui/Modal";
import ModalBox from "@/components/ui/ModalBox";
import { useSchemaForm } from "@/hooks/useSchemaForm";
import { useCreateModelTrimMutation, useGetModelTrimQuery, useUpdateModelTrimMutation } from "@/redux/api/modelTrimApi";
import { useWaitForQueryRefresh } from "@/redux/store/queryRefresh";
import { getApiErrorMessage } from "@/utils/apiError";
import { emptyTrimForm, trimCode, trimFormSchema, type TrimFormValues } from "../modelTrimSchemas";
import { powertrainOptions, toPowertrain, toTrimStatus, trimStatusOptions, type CmsModelTrim, type ModelTrimPayload } from "../modelTrimTypes";

function blankToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function formFromTrim(trim: CmsModelTrim): TrimFormValues {
  return {
    name: trim.name,
    powertrain: toPowertrain(trim.powertrain_type),
    price: String(trim.price),
    currencyCode: trim.currency_code || "KWD",
    description: trim.description ?? "",
    status: toTrimStatus(trim.status),
  };
}

function toPayload(values: TrimFormValues, versionId: number, versionCode: string, sortOrder: number): ModelTrimPayload {
  return {
    model_version_id: versionId,
    name: values.name.trim(),
    code: trimCode(versionCode, values.name),
    powertrain_type: values.powertrain,
    price: Number(values.price),
    currency_code: values.currencyCode.trim().toUpperCase(),
    description: blankToNull(values.description),
    sort_order: sortOrder,
    status: values.status,
  };
}

type TrimFormModalProps = {
  open: boolean;
  trimId: number | null;
  versionId: number;
  versionCode: string;
  onClose: () => void;
};

export default function TrimFormModal({ open, trimId, versionId, versionCode, onClose }: TrimFormModalProps) {
  const editing = trimId !== null;
  const waitForRefresh = useWaitForQueryRefresh();
  const [createTrim, createMutation] = useCreateModelTrimMutation();
  const [updateTrim, updateMutation] = useUpdateModelTrimMutation();
  const [refreshing, setRefreshing] = useState(false);
  const form = useSchemaForm(trimFormSchema, emptyTrimForm);
  const { reset, formState: { errors, isSubmitting } } = form;
  const detailQuery = useGetModelTrimQuery(trimId ?? 0, { skip: !open || !editing });
  const isSaving = createMutation.isLoading || updateMutation.isLoading || refreshing || isSubmitting;
  const isLoadingDetail = editing && (detailQuery.isLoading || detailQuery.isFetching) && !detailQuery.data;

  useEffect(() => {
    if (!open) return;
    if (!editing) {
      reset(emptyTrimForm);
      return;
    }
    if (detailQuery.data && detailQuery.data.id === trimId) reset(formFromTrim(detailQuery.data));
  }, [detailQuery.data, editing, open, reset, trimId]);

  async function submit(values: TrimFormValues) {
    if (isSaving || isLoadingDetail) return;
    try {
      const sortOrder = editing ? detailQuery.data?.sort_order ?? 0 : 0;
      const payload = toPayload(values, versionId, versionCode, sortOrder);
      const result = editing
        ? await updateTrim({ id: trimId, payload }).unwrap()
        : await createTrim(payload).unwrap();
      setRefreshing(true);
      toast.success(result.message);
      await waitForRefresh();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, editing ? "Could not update the trim." : "Could not create the trim."));
    } finally {
      setRefreshing(false);
    }
  }

  const detailError = detailQuery.isError ? getApiErrorMessage(detailQuery.error, "Could not load the trim.") : null;

  return (
    <ModalBox
      open={open}
      title={editing ? "Edit trim" : "Add trim"}
      description={editing ? "Update this trim and its price." : "Add a priced trim for this variant."}
      onClose={onClose}
      size={ModalSize.lg}
      align={ModalAlign.center}
    >
      {isLoadingDetail ? (
        <div className="flex items-center justify-center gap-3 py-8 text-sm text-slate-600">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-teal-700" />
          Loading trim
        </div>
      ) : (
        <form onSubmit={form.submitForm(submit)} className="grid gap-3 md:grid-cols-2" noValidate>
          {detailError ? <p className="text-sm text-rose-600 md:col-span-2">{detailError}</p> : null}
          <Field label="Name" error={errors.name?.message}>
            <FormInput form={form} name="name" htmlName="name" placeholder="Premium" disabled={isSaving} />
          </Field>
          <Field label="Powertrain" error={errors.powertrain?.message}>
            <FormSelect form={form} name="powertrain" htmlName="powertrain" options={powertrainOptions} disabled={isSaving} />
          </Field>
          <Field label="Price" error={errors.price?.message}>
            <FormInput form={form} name="price" htmlName="price" placeholder="12990" inputMode="decimal" disabled={isSaving} />
          </Field>
          <Field label="Currency" error={errors.currencyCode?.message}>
            <FormInput
              form={form}
              name="currencyCode"
              htmlName="currencyCode"
              placeholder="KWD"
              transform={(value) => value.toUpperCase()}
              disabled={isSaving}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Description" error={errors.description?.message}>
              <FormTextarea form={form} name="description" htmlName="description" placeholder="What this trim includes" rows={3} disabled={isSaving} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Status" error={errors.status?.message}>
              <FormSelect form={form} name="status" htmlName="status" options={trimStatusOptions} disabled={isSaving} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Button variant={ButtonVariant.primary} type="submit" width="100%" height={34} disabled={isSaving || Boolean(detailError)}>
              {isSaving ? "Saving..." : "Submit"}
            </Button>
          </div>
        </form>
      )}
    </ModalBox>
  );
}
