import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FormInput, FormSelect, FormTextarea } from "@/components/form/FormControls";
import Button, { ButtonVariant } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { ModalAlign, ModalSize } from "@/components/ui/Modal";
import ModalBox from "@/components/ui/ModalBox";
import { useSchemaForm } from "@/hooks/useSchemaForm";
import { useGetOemsQuery } from "@/redux/api/oemApi";
import { useCreateModelMutation, useGetModelQuery, useUpdateModelMutation } from "@/redux/api/modelApi";
import { useWaitForQueryRefresh } from "@/redux/store/queryRefresh";
import { getApiErrorMessage } from "@/utils/apiError";
import { emptyVehicleModelForm, modelCodeFromName, modelSlugFromName, vehicleModelFormSchema, type VehicleModelFormValues } from "../vehicleModelSchemas";
import { modelStatusOptions, toModelStatus, type CmsVehicleModel, type ModelPayload } from "../vehicleModelTypes";

function blankToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function formFromModel(model: CmsVehicleModel): VehicleModelFormValues {
  return {
    oemId: String(model.oem_id),
    name: model.name,
    bodyType: model.body_type,
    shortDescription: model.short_description ?? "",
    description: model.description ?? "",
    metaTitle: model.seo?.meta_title ?? "",
    metaDescription: model.seo?.meta_description ?? "",
    keywords: model.seo?.keywords.join(", ") ?? "",
    isFeatured: model.is_featured,
    status: toModelStatus(model.status),
  };
}

function toPayload(values: VehicleModelFormValues, sortOrder: number): ModelPayload {
  const keywords = values.keywords.split(",").map((keyword: string) => keyword.trim()).filter(Boolean);
  const metaTitle = blankToNull(values.metaTitle);
  const metaDescription = blankToNull(values.metaDescription);
  return {
    oem_id: Number(values.oemId),
    name: values.name.trim(),
    code: modelCodeFromName(values.name),
    slug: modelSlugFromName(values.name),
    body_type: values.bodyType.trim(),
    short_description: blankToNull(values.shortDescription),
    description: blankToNull(values.description),
    seo: !metaTitle && !metaDescription && keywords.length === 0
      ? null
      : { meta_title: metaTitle, meta_description: metaDescription, keywords },
    is_featured: values.isFeatured,
    sort_order: sortOrder,
    status: values.status,
  };
}

type ModelFormModalProps = {
  open: boolean;
  modelId: number | null;
  onClose: () => void;
};

export default function ModelFormModal({ open, modelId, onClose }: ModelFormModalProps) {
  const editing = modelId !== null;
  const waitForRefresh = useWaitForQueryRefresh();
  const [createModel, createMutation] = useCreateModelMutation();
  const [updateModel, updateMutation] = useUpdateModelMutation();
  const [refreshing, setRefreshing] = useState(false);
  const form = useSchemaForm(vehicleModelFormSchema, emptyVehicleModelForm);
  const { reset, formState: { errors, isSubmitting } } = form;
  const detailQuery = useGetModelQuery(modelId ?? 0, { skip: !open || !editing });
  const oemsQuery = useGetOemsQuery(undefined, { skip: !open });
  const isSaving = createMutation.isLoading || updateMutation.isLoading || refreshing || isSubmitting;
  const isLoadingDetail = editing && (detailQuery.isLoading || detailQuery.isFetching) && !detailQuery.data;
  const oemOptions = (oemsQuery.data ?? []).map((oem) => ({ value: String(oem.id), label: oem.name }));

  useEffect(() => {
    if (!open) return;
    if (!editing) {
      reset(emptyVehicleModelForm);
      return;
    }
    if (detailQuery.data && detailQuery.data.id === modelId) reset(formFromModel(detailQuery.data));
  }, [detailQuery.data, editing, modelId, open, reset]);

  async function submit(values: VehicleModelFormValues) {
    if (isSaving || isLoadingDetail) return;
    try {
      const payload = toPayload(values, editing ? detailQuery.data?.sort_order ?? 0 : 0);
      const result = editing
        ? await updateModel({ id: modelId, payload }).unwrap()
        : await createModel(payload).unwrap();
      setRefreshing(true);
      toast.success(result.message);
      await waitForRefresh();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, editing ? "Could not update the model." : "Could not create the model."));
    } finally {
      setRefreshing(false);
    }
  }

  const detailError = detailQuery.isError ? getApiErrorMessage(detailQuery.error, "Could not load the model.") : null;

  return (
    <ModalBox
      open={open}
      title={editing ? "Edit model" : "Add model"}
      description={editing ? "Update this vehicle model." : "Add a vehicle model for an OEM."}
      onClose={onClose}
      size={ModalSize.lg}
      align={ModalAlign.center}
    >
      {isLoadingDetail ? (
        <div className="flex items-center justify-center gap-3 py-8 text-sm text-slate-600">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-teal-700" />
          Loading model
        </div>
      ) : (
        <form onSubmit={form.submitForm(submit)} className="grid gap-3 md:grid-cols-2" noValidate>
          {detailError ? <p className="text-sm text-rose-600 md:col-span-2">{detailError}</p> : null}
          <Field label="OEM" error={errors.oemId?.message}>
            <FormSelect
              form={form}
              name="oemId"
              htmlName="oemId"
              placeholder="Choose OEM"
              options={oemOptions}
              disabled={isSaving || oemsQuery.isLoading}
            />
          </Field>
          <Field label="Name" error={errors.name?.message}>
            <FormInput form={form} name="name" htmlName="name" placeholder="Enter name" disabled={isSaving} />
          </Field>
          <Field label="Body type" error={errors.bodyType?.message}>
            <FormInput form={form} name="bodyType" htmlName="bodyType" placeholder="Sedan" disabled={isSaving} />
          </Field>
          <Field label="Short description" error={errors.shortDescription?.message}>
            <FormInput form={form} name="shortDescription" htmlName="shortDescription" placeholder="Short summary" disabled={isSaving} />
          </Field>
          <Field label="Status" error={errors.status?.message}>
            <FormSelect form={form} name="status" htmlName="status" options={modelStatusOptions} disabled={isSaving} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Description" error={errors.description?.message}>
              <FormTextarea form={form} name="description" htmlName="description" placeholder="Full description" rows={3} disabled={isSaving} />
            </Field>
          </div>
          <Field label="Meta title" error={errors.metaTitle?.message}>
            <FormInput form={form} name="metaTitle" htmlName="metaTitle" placeholder="Search title" disabled={isSaving} />
          </Field>
          <Field label="Meta description" error={errors.metaDescription?.message}>
            <FormInput form={form} name="metaDescription" htmlName="metaDescription" placeholder="Search description" disabled={isSaving} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Keywords" error={errors.keywords?.message} hint="Separate keywords with commas.">
              <FormInput form={form} name="keywords" htmlName="keywords" placeholder="sedan, family" disabled={isSaving} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
            <input
              type="checkbox"
              className="h-4 w-4 accent-teal-700"
              checked={form.watch("isFeatured")}
              disabled={isSaving}
              onChange={(event) => form.setValue("isFeatured", event.target.checked, { shouldDirty: true })}
            />
            Featured model
          </label>
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
