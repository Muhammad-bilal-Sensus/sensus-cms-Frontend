import { useEffect, useState } from "react";
import { toast } from "sonner";
import { oemStatusOptions, toOemStatus } from "@/features/oems/oemTypes";
import { useCreateMicrositeMutation, useGetMicrositeQuery, useUpdateMicrositeMutation } from "@/redux/api/micrositeApi";
import { useWaitForQueryRefresh } from "@/redux/store/queryRefresh";
import { getApiErrorMessage } from "@/utils/apiError";
import Button from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { FormInput, FormSelect } from "@/components/form/FormControls";
import { useSchemaForm } from "@/hooks/useSchemaForm";
import { emptyMicrositeForm, micrositeFormSchema, type MicrositeFormValues } from "../micrositeSchemas";
import type { CmsMicrosite, CreateMicrositePayload, MicrositeSettingsPayload, UpdateMicrositePayload } from "../micrositeTypes";

type MicrositeFormModalProps = {
  open: boolean;
  oemId: number;
  oemName: string;
  micrositeId: number | null;
  onClose: () => void;
};

function formFromMicrosite(microsite: CmsMicrosite): MicrositeFormValues {
  return {
    name: microsite.name ?? "",
    slug: microsite.slug ?? "",
    domain: microsite.domain ?? "",
    locale: microsite.settings?.locale ?? "",
    fallbackLocale: microsite.settings?.fallback_locale ?? "",
    currency: microsite.settings?.currency ?? "",
    contactEmail: microsite.settings?.contact_email ?? "",
    status: toOemStatus(microsite.status),
  };
}

function toSettings(values: MicrositeFormValues, current: CmsMicrosite | undefined): MicrositeSettingsPayload {
  return {
    ...(current?.settings?.theme ? { theme: current.settings.theme } : {}),
    locale: values.locale.trim(),
    fallback_locale: values.fallbackLocale.trim(),
    currency: values.currency.trim().toUpperCase(),
    contact_email: values.contactEmail.trim(),
  };
}

export default function MicrositeFormModal({ open, oemId, oemName, micrositeId, onClose }: MicrositeFormModalProps) {
  const editing = micrositeId !== null;
  const waitForRefresh = useWaitForQueryRefresh();
  const [createMicrosite, createMutation] = useCreateMicrositeMutation();
  const [updateMicrosite, updateMutation] = useUpdateMicrositeMutation();
  const [refreshing, setRefreshing] = useState(false);
  const form = useSchemaForm(micrositeFormSchema, emptyMicrositeForm);
  const { reset, formState: { errors, isSubmitting } } = form;
  const detailQuery = useGetMicrositeQuery(micrositeId ?? 0, { skip: !open || !editing });
  const isSaving = createMutation.isLoading || updateMutation.isLoading || refreshing || isSubmitting;
  const isLoadingDetail = editing && (detailQuery.isLoading || detailQuery.isFetching) && !detailQuery.data;

  useEffect(() => {
    if (!open) return;
    if (!editing) {
      reset(emptyMicrositeForm);
      return;
    }
    if (detailQuery.data && detailQuery.data.id === micrositeId) reset(formFromMicrosite(detailQuery.data));
  }, [detailQuery.data, editing, micrositeId, open, reset]);

  async function submit(values: MicrositeFormValues) {
    if (isSaving || isLoadingDetail) return;
    try {
      const settings = toSettings(values, detailQuery.data);
      const fields = {
        name: values.name.trim(),
        slug: values.slug.trim().toLowerCase(),
        domain: values.domain.trim(),
        settings,
        status: values.status,
      };
      const result = micrositeId === null
        ? await createMicrosite({ oem_id: oemId, ...fields } satisfies CreateMicrositePayload).unwrap()
        : await updateMicrosite({ id: micrositeId, payload: fields satisfies UpdateMicrositePayload }).unwrap();
      setRefreshing(true);
      toast.success(result.message);
      await waitForRefresh();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, editing ? "Could not update the microsite." : "Could not create the microsite."));
    } finally {
      setRefreshing(false);
    }
  }

  const detailError = detailQuery.isError ? getApiErrorMessage(detailQuery.error, "Could not load the microsite.") : null;

  return (
    <Modal
      open={open}
      title={editing ? "Edit microsite" : "Add microsite"}
      description={editing ? `Update this site for ${oemName}.` : `Add a site for ${oemName}.`}
      onClose={onClose}
      size="lg"
      align="center"
      compact
    >
      <div className="mb-2 [&_input]:h-8 [&_label]:gap-0.5">
        <Field label="OEM">
          <Input value={oemName} onChange={() => undefined} readOnly name="oem" />
        </Field>
      </div>
      {isLoadingDetail ? (
        <div className="flex items-center justify-center gap-3 py-8 text-sm text-slate-600">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-teal-700" />
          Loading microsite
        </div>
      ) : (
        <form onSubmit={form.submitForm(submit)} className="grid gap-2 sm:grid-cols-2 [&_input]:h-8 [&_label]:gap-0.5 [&_select]:h-8" noValidate>
          {detailError ? <p className="text-sm text-rose-600 sm:col-span-2">{detailError}</p> : null}
          <Field label="Name" error={errors.name?.message}>
            <FormInput form={form} name="name" htmlName="name" placeholder="Enter name" disabled={isSaving} />
          </Field>
          <Field label="Slug" error={errors.slug?.message}>
            <FormInput
              form={form}
              name="slug"
              htmlName="slug"
              placeholder="arcfox-kuwait"
              transform={(value) => value.toLowerCase().replace(/\s+/g, "-")}
              disabled={isSaving}
            />
          </Field>
          <Field label="Domain" error={errors.domain?.message}>
            <FormInput form={form} name="domain" htmlName="domain" placeholder="arcfox.example.com" disabled={isSaving} />
          </Field>
          <Field label="Status">
            <FormSelect form={form} name="status" htmlName="status" options={oemStatusOptions} disabled={isSaving} />
          </Field>
          <Field label="Locale" error={errors.locale?.message}>
            <FormInput form={form} name="locale" htmlName="locale" placeholder="en" disabled={isSaving} />
          </Field>
          <Field label="Fallback locale" error={errors.fallbackLocale?.message}>
            <FormInput form={form} name="fallbackLocale" htmlName="fallback_locale" placeholder="ar" disabled={isSaving} />
          </Field>
          <Field label="Currency" error={errors.currency?.message}>
            <FormInput
              form={form}
              name="currency"
              htmlName="currency"
              placeholder="KWD"
              transform={(value) => value.toUpperCase()}
              disabled={isSaving}
            />
          </Field>
          <Field label="Contact email" error={errors.contactEmail?.message}>
            <FormInput form={form} name="contactEmail" htmlName="contact_email" type="email" placeholder="info@example.com" disabled={isSaving} />
          </Field>
          <div className="sm:col-span-2">
            <Button variant="primary" type="submit" width="100%" height={34} disabled={isSaving || Boolean(detailError)}>
              {isSaving ? "Saving..." : "Submit"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
