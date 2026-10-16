import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Icon, TrashIcon } from "@/components/icons/Icon";
import { toOemStatus } from "@/features/oems/oemTypes";
import { useCreateMicrositeMutation, useGetMicrositeQuery, useUpdateMicrositeMutation } from "@/redux/api/micrositeApi";
import { useWaitForQueryRefresh } from "@/redux/store/queryRefresh";
import { getApiErrorMessage } from "@/utils/apiError";
import { emailSchema } from "@/utils/validators";
import Button from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { FormInput } from "@/components/form/FormControls";
import { StatusFormSelect } from "@/components/ui/Status";
import { useSchemaForm } from "@/hooks/useSchemaForm";
import { emptyMicrositeForm, micrositeFormSchema, type MicrositeFormValues } from "../micrositeSchemas";
import type { CmsMicrosite, CreateMicrositePayload, MicrositeSettings, MicrositeSettingsPayload, UpdateMicrositePayload } from "../micrositeTypes";

type MicrositeFormModalProps = {
  open: boolean;
  oemId: number;
  oemName: string;
  micrositeId: number | null;
  onClose: () => void;
};

const knownSettings = [
  { key: "locale", label: "Locale", placeholder: "en" },
  { key: "fallback_locale", label: "Fallback locale", placeholder: "ar" },
  { key: "currency", label: "Currency", placeholder: "KWD" },
  { key: "contact_email", label: "Contact email", placeholder: "info@example.com" },
] as const;

type SettingRow = {
  id: string;
  key: string;
  label: string;
  value: string;
  custom: boolean;
};

function defaultSettingRows(): SettingRow[] {
  return knownSettings.map((item) => ({
    id: item.key,
    key: item.key,
    label: item.label,
    value: "",
    custom: false,
  }));
}

function settingRowsFromMicrosite(settings: MicrositeSettings | null | undefined): SettingRow[] {
  const source = (settings ?? {}) as Record<string, unknown>;
  const text = new Map<string, string>();
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === "string") text.set(key, value);
    else if (typeof value === "number" || typeof value === "boolean") text.set(key, String(value));
  }

  const rows: SettingRow[] = [];
  for (const item of knownSettings) {
    if (!text.has(item.key)) continue;
    rows.push({
      id: item.key,
      key: item.key,
      label: item.label,
      value: text.get(item.key) ?? "",
      custom: false,
    });
    text.delete(item.key);
  }
  for (const [key, value] of text) {
    rows.push({ id: `existing-${key}`, key, label: key, value, custom: true });
  }
  return rows;
}

function settingKey(row: SettingRow) {
  return (row.custom ? row.label : row.key).trim();
}

function buildSettings(rows: SettingRow[]): { settings?: MicrositeSettingsPayload; error?: string } {
  const settings: MicrositeSettingsPayload = {};
  const seen = new Set<string>();

  for (const row of rows) {
    const key = settingKey(row);
    const value = (key === "currency" ? row.value.toUpperCase() : row.value).trim();
    if (!key && !value) continue;
    if (!key) return { error: "Enter a label for each setting." };
    if (seen.has(key)) return { error: "Use each setting label once." };
    seen.add(key);
    if (!value) continue;
    if (key === "contact_email" && !emailSchema.safeParse(value).success) {
      return { error: "Enter a valid email address." };
    }
    settings[key] = value;
  }

  return { settings };
}

function formFromMicrosite(microsite: CmsMicrosite): MicrositeFormValues {
  return {
    name: microsite.name ?? "",
    slug: microsite.slug ?? "",
    domain: microsite.domain ?? "",
    status: toOemStatus(microsite.status),
  };
}

export default function MicrositeFormModal({ open, oemId, oemName, micrositeId, onClose }: MicrositeFormModalProps) {
  const editing = micrositeId !== null;
  const waitForRefresh = useWaitForQueryRefresh();
  const [createMicrosite, createMutation] = useCreateMicrositeMutation();
  const [updateMicrosite, updateMutation] = useUpdateMicrositeMutation();
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState<SettingRow[]>(defaultSettingRows);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState<string | null>(null);
  const labelOpen = useRef(false);
  const labelDraftRef = useRef<string | null>(null);
  const form = useSchemaForm(micrositeFormSchema, emptyMicrositeForm);
  const { reset, formState: { errors, isSubmitting } } = form;
  const detailQuery = useGetMicrositeQuery(micrositeId ?? 0, { skip: !open || !editing });
  const isSaving = createMutation.isLoading || updateMutation.isLoading || refreshing || isSubmitting;
  const isLoadingDetail = editing && (detailQuery.isLoading || detailQuery.isFetching) && !detailQuery.data;

  function updateSettings(updater: (current: SettingRow[]) => SettingRow[]) {
    setSettingsError(null);
    setSettings(updater);
  }

  function closeLabelDraft() {
    labelOpen.current = false;
    labelDraftRef.current = null;
    setLabelDraft(null);
  }

  function startAddSetting() {
    if (labelOpen.current || isSaving) return;
    labelOpen.current = true;
    labelDraftRef.current = "";
    setLabelDraft("");
  }

  function takeLabelDraft(rows: SettingRow[]) {
    if (!labelOpen.current) return rows;
    const label = (labelDraftRef.current ?? "").trim();
    closeLabelDraft();
    if (!label) return rows;
    return [...rows, { id: crypto.randomUUID(), key: label, label, value: "", custom: true }];
  }

  function commitLabel(name: string) {
    if (!labelOpen.current) return;
    labelDraftRef.current = name;
    const next = takeLabelDraft(settings);
    if (next !== settings) updateSettings(() => next);
  }

  useEffect(() => {
    if (!open) return;
    if (!editing) {
      reset(emptyMicrositeForm);
      setSettings(defaultSettingRows());
      setSettingsError(null);
      closeLabelDraft();
      return;
    }
    if (detailQuery.data && detailQuery.data.id === micrositeId) {
      reset(formFromMicrosite(detailQuery.data));
      setSettings(settingRowsFromMicrosite(detailQuery.data.settings));
      setSettingsError(null);
      closeLabelDraft();
    }
  }, [detailQuery.data, editing, micrositeId, open, reset]);

  async function submit(values: MicrositeFormValues) {
    if (isSaving || isLoadingDetail) return;
    try {
      const settingRows = takeLabelDraft(settings);
      if (settingRows !== settings) setSettings(settingRows);
      const built = buildSettings(settingRows);
      if (built.error || !built.settings) {
        setSettingsError(built.error ?? "Check the settings.");
        return;
      }
      setSettingsError(null);
      const slug = values.slug.trim().toLowerCase();
      const fields = {
        name: values.name.trim(),
        ...(slug ? { slug } : {}),
        domain: values.domain.trim(),
        settings: built.settings,
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
          <Field label="Slug" hint="Optional" error={errors.slug?.message}>
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
            <StatusFormSelect form={form} name="status" htmlName="status" disabled={isSaving} />
          </Field>
          <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
            <p className="text-xs font-medium text-slate-500 sm:col-span-2">Settings</p>
            {settings.map((row) => {
              const known = knownSettings.find((item) => item.key === row.key);
              return (
                <div key={row.id} className="flex items-start gap-1">
                  <div className="min-w-0 flex-1">
                    <Field label={row.label}>
                      <Input
                        value={row.value}
                        onChange={(value) => updateSettings((current) => current.map((item) => item.id === row.id ? { ...item, value: row.key === "currency" ? value.toUpperCase() : value } : item))}
                        placeholder={known?.placeholder}
                        type={row.key === "contact_email" ? "email" : "text"}
                        disabled={isSaving}
                        name={row.key || row.id}
                      />
                    </Field>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${row.label || "setting"}`}
                    disabled={isSaving}
                    onClick={() => updateSettings((current) => current.filter((item) => item.id !== row.id))}
                    className="mt-5 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <TrashIcon />
                  </button>
                </div>
              );
            })}
            {settingsError ? <p className="text-sm text-rose-600 sm:col-span-2">{settingsError}</p> : null}
            {labelDraft !== null ? (
              <div className="min-w-0">
                <Field label="Label">
                  <Input
                    value={labelDraft}
                    onChange={(value) => {
                      labelDraftRef.current = value;
                      setLabelDraft(value);
                    }}
                    placeholder="Enter label"
                    autoFocus
                    disabled={isSaving}
                    name="setting-label"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        commitLabel(labelDraft);
                      }
                      if (event.key === "Escape") {
                        event.preventDefault();
                        closeLabelDraft();
                      }
                    }}
                    onBlur={() => commitLabel(labelDraft)}
                  />
                </Field>
              </div>
            ) : (
              <button
                type="button"
                aria-label="Add setting"
                disabled={isSaving}
                onClick={startAddSetting}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-slate-300 text-teal-700 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon name="plus" className="h-4 w-4" />
              </button>
            )}
          </div>
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
