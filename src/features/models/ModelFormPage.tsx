import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { FormInput, FormSelect, FormTextarea } from "@/components/form/FormControls";
import { Icon } from "@/components/icons/Icon";
import Button, { ButtonVariant } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { ROUTES } from "@/constants/routes";
import { useSchemaForm } from "@/hooks/useSchemaForm";
import { useCreateModelMutation, useGetModelQuery, useUpdateModelMutation } from "@/redux/api/modelApi";
import { useGetOemsQuery } from "@/redux/api/oemApi";
import { useWaitForQueryRefresh } from "@/redux/store/queryRefresh";
import { getApiErrorMessage } from "@/utils/apiError";
import { emptyVehicleModelForm, modelCodeFromName, modelSlugFromName, vehicleModelFormSchema, type VehicleModelFormValues } from "./vehicleModelSchemas";
import { modelStatusOptions, toModelStatus, type CmsVehicleModel, type ModelPayload } from "./vehicleModelTypes";

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

export default function ModelFormPage() {
  const params = useParams();
  const navigate = useNavigate();
  const editing = params.modelId !== undefined;
  const modelId = Number(params.modelId);
  const validId = !editing || (Number.isInteger(modelId) && modelId > 0);
  const waitForRefresh = useWaitForQueryRefresh();
  const [createModel, createMutation] = useCreateModelMutation();
  const [updateModel, updateMutation] = useUpdateModelMutation();
  const [refreshing, setRefreshing] = useState(false);
  const form = useSchemaForm(vehicleModelFormSchema, emptyVehicleModelForm);
  const { reset, formState: { errors, isSubmitting } } = form;
  const detailQuery = useGetModelQuery(editing && validId ? modelId : 0, { skip: !editing || !validId });
  const oemsQuery = useGetOemsQuery();
  const isSaving = createMutation.isLoading || updateMutation.isLoading || refreshing || isSubmitting;
  const isLoadingDetail = editing && (detailQuery.isLoading || detailQuery.isFetching) && !detailQuery.data;
  const oemOptions = (oemsQuery.data ?? []).map((oem) => ({ value: String(oem.id), label: oem.name }));
  const detailError = detailQuery.isError ? getApiErrorMessage(detailQuery.error, "Could not load the model.") : null;

  useEffect(() => {
    if (!editing) {
      reset(emptyVehicleModelForm);
      return;
    }
    if (detailQuery.data && detailQuery.data.id === modelId) reset(formFromModel(detailQuery.data));
  }, [detailQuery.data, editing, modelId, reset]);

  async function submit(values: VehicleModelFormValues) {
    if (!validId || isSaving || isLoadingDetail) return;
    try {
      const payload = toPayload(values, editing ? detailQuery.data?.sort_order ?? 0 : 0);
      const result = editing
        ? await updateModel({ id: modelId, payload }).unwrap()
        : await createModel(payload).unwrap();
      setRefreshing(true);
      toast.success(result.message);
      await waitForRefresh();
      navigate(ROUTES.models);
    } catch (error) {
      toast.error(getApiErrorMessage(error, editing ? "Could not update the model." : "Could not create the model."));
    } finally {
      setRefreshing(false);
    }
  }

  if (!validId) return <Navigate to={ROUTES.models} replace />;

  return (
    <form onSubmit={form.submitForm(submit)} noValidate className="mx-auto w-full max-w-[1100px] space-y-5 pb-8">
      <section className="rounded-lg border border-slate-200 bg-white px-5 py-4">
        <div>
          <p className="text-xs text-slate-500">
            Sensus AI <span className="px-1 text-slate-300">/</span>
            <Link to={ROUTES.models} className="hover:text-slate-700">Models</Link>
            <span className="px-1 text-slate-300">/</span>
            {editing ? "Edit" : "New"}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(ROUTES.models)}
              disabled={isSaving}
              aria-label="Back to models"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              <Icon name="chevronLeft" className="h-5 w-5" />
            </button>
            <h1 className="font-brand text-2xl font-semibold text-slate-900">{editing ? "Edit model" : "Add model"}</h1>
          </div>
          <p className="mt-1 pl-10 text-sm text-slate-500">
            {editing ? "Update this vehicle model." : "Add a vehicle model for an OEM."}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        {isLoadingDetail ? (
          <div className="flex items-center justify-center gap-3 py-8 text-sm text-slate-600">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-teal-700" />
            Loading model
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
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
            <div className="flex justify-end gap-2 md:col-span-2">
              <Button variant={ButtonVariant.secondary} type="button" onClick={() => navigate(ROUTES.models)} disabled={isSaving}>
                Cancel
              </Button>
              <Button variant={ButtonVariant.primary} type="submit" disabled={isSaving || Boolean(detailError)}>
                {isSaving ? "Saving..." : "Submit"}
              </Button>
            </div>
          </div>
        )}
      </section>
    </form>
  );
}
