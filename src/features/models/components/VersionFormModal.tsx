import { useEffect, useState } from "react";
import { useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { FormInput, FormSelect, FormTextarea } from "@/components/form/FormControls";
import Button, { ButtonVariant } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { ModalAlign, ModalSize } from "@/components/ui/Modal";
import ModalBox from "@/components/ui/ModalBox";
import { useSchemaForm } from "@/hooks/useSchemaForm";
import { useCreateModelVersionMutation, useGetModelVersionQuery, useUpdateModelVersionMutation } from "@/redux/api/modelVersionApi";
import { useWaitForQueryRefresh } from "@/redux/store/queryRefresh";
import { getApiErrorMessage } from "@/utils/apiError";
import { emptyVersionForm, versionCode, versionFormSchema, versionSections, type VersionFormValues } from "../modelVersionSchemas";
import type { CmsModelVersion, ModelVersionPayload } from "../modelVersionTypes";
import { modelStatusOptions, toModelStatus } from "../vehicleModelTypes";

function formFromVersion(version: CmsModelVersion): VersionFormValues {
  return {
    name: version.name,
    modelYear: String(version.model_year),
    launchDate: version.launch_date ?? "",
    endDate: version.end_date ?? "",
    sections: version.content_sections.map((section) => ({ key: section.key, title: section.title, body: section.body })),
    status: toModelStatus(version.status),
  };
}

function toPayload(values: VersionFormValues, modelId: number, modelCode: string): ModelVersionPayload {
  return {
    model_id: modelId,
    name: values.name.trim(),
    code: versionCode(modelCode, values.name, values.modelYear),
    model_year: Number(values.modelYear),
    launch_date: values.launchDate || null,
    end_date: values.endDate || null,
    content_sections: versionSections(values.sections),
    status: values.status,
  };
}

type VersionFormModalProps = {
  open: boolean;
  versionId: number | null;
  modelId: number;
  modelCode: string;
  onClose: () => void;
};

export default function VersionFormModal({ open, versionId, modelId, modelCode, onClose }: VersionFormModalProps) {
  const editing = versionId !== null;
  const waitForRefresh = useWaitForQueryRefresh();
  const [createVersion, createMutation] = useCreateModelVersionMutation();
  const [updateVersion, updateMutation] = useUpdateModelVersionMutation();
  const [refreshing, setRefreshing] = useState(false);
  const form = useSchemaForm(versionFormSchema, emptyVersionForm);
  const sections = useFieldArray({ control: form.control, name: "sections" });
  const { reset, formState: { errors, isSubmitting } } = form;
  const detailQuery = useGetModelVersionQuery(versionId ?? 0, { skip: !open || !editing });
  const isSaving = createMutation.isLoading || updateMutation.isLoading || refreshing || isSubmitting;
  const isLoadingDetail = editing && (detailQuery.isLoading || detailQuery.isFetching) && !detailQuery.data;

  useEffect(() => {
    if (!open) return;
    if (!editing) {
      reset(emptyVersionForm);
      return;
    }
    if (detailQuery.data && detailQuery.data.id === versionId) reset(formFromVersion(detailQuery.data));
  }, [detailQuery.data, editing, open, reset, versionId]);

  async function submit(values: VersionFormValues) {
    if (isSaving || isLoadingDetail) return;
    try {
      const payload = toPayload(values, modelId, modelCode);
      const result = editing
        ? await updateVersion({ id: versionId, payload }).unwrap()
        : await createVersion(payload).unwrap();
      setRefreshing(true);
      toast.success(result.message);
      await waitForRefresh();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, editing ? "Could not update the variant." : "Could not create the variant."));
    } finally {
      setRefreshing(false);
    }
  }

  const detailError = detailQuery.isError ? getApiErrorMessage(detailQuery.error, "Could not load the variant.") : null;

  return (
    <ModalBox
      open={open}
      title={editing ? "Edit variant" : "Add variant"}
      description={editing ? "Update this model year." : "Add a model year for this vehicle."}
      onClose={onClose}
      size={ModalSize.lg}
      align={ModalAlign.center}
    >
      {isLoadingDetail ? (
        <div className="flex items-center justify-center gap-3 py-8 text-sm text-slate-600">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-teal-700" />
          Loading variant
        </div>
      ) : (
        <form onSubmit={form.submitForm(submit)} className="grid gap-3 md:grid-cols-2" noValidate>
          {detailError ? <p className="text-sm text-rose-600 md:col-span-2">{detailError}</p> : null}
          <Field label="Name" error={errors.name?.message}>
            <FormInput form={form} name="name" htmlName="name" placeholder="Limited" disabled={isSaving} />
          </Field>
          <Field label="Model year" error={errors.modelYear?.message}>
            <FormInput form={form} name="modelYear" htmlName="modelYear" placeholder="2026" inputMode="numeric" disabled={isSaving} />
          </Field>
          <Field label="Launch date" error={errors.launchDate?.message}>
            <FormInput form={form} name="launchDate" htmlName="launchDate" type="date" disabled={isSaving} />
          </Field>
          <Field label="End date" error={errors.endDate?.message}>
            <FormInput form={form} name="endDate" htmlName="endDate" type="date" disabled={isSaving} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Status" error={errors.status?.message}>
              <FormSelect form={form} name="status" htmlName="status" options={modelStatusOptions} disabled={isSaving} />
            </Field>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Content sections</h3>
                <p className="mt-0.5 text-xs text-slate-500">Optional blocks shown with this variant.</p>
              </div>
              <Button variant={ButtonVariant.secondary} height={32} disabled={isSaving} onClick={() => sections.append({ key: "", title: "", body: "" })}>
                Add section
              </Button>
            </div>
            {sections.fields.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No sections yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {sections.fields.map((section, index) => (
                  <div key={section.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-500">Section {index + 1}</p>
                      <button
                        type="button"
                        className="cursor-pointer text-xs font-medium text-rose-600 hover:text-rose-700"
                        disabled={isSaving}
                        onClick={() => sections.remove(index)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid gap-3">
                      <Field label="Key" error={errors.sections?.[index]?.key?.message} hint="A short id, separate from the title.">
                        <FormInput form={form} name={`sections.${index}.key`} placeholder="cooling_system" disabled={isSaving} />
                      </Field>
                      <Field label="Title" error={errors.sections?.[index]?.title?.message}>
                        <FormInput form={form} name={`sections.${index}.title`} placeholder="Overview" disabled={isSaving} />
                      </Field>
                      <Field label="Body" error={errors.sections?.[index]?.body?.message}>
                        <FormTextarea form={form} name={`sections.${index}.body`} placeholder="Describe this section" rows={3} disabled={isSaving} />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

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
