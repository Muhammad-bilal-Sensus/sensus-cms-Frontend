import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCreateBranchMutation, useGetBranchQuery, useUpdateBranchMutation } from "@/redux/api/branchApi";
import { useWaitForQueryRefresh } from "@/redux/store/queryRefresh";
import { getApiErrorMessage } from "@/utils/apiError";
import Button, { ButtonVariant } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import ModalBox from "@/components/ui/ModalBox";
import { ModalAlign, ModalSize } from "@/components/ui/Modal";
import { FormInput } from "@/components/form/FormControls";
import { StatusFormSelect, toRecordStatus } from "@/components/ui/Status";
import { useSchemaForm } from "@/hooks/useSchemaForm";
import { emptyBranchForm, splitOpeningHours, branchFormSchema, type BranchFormValues, type ExtraHour } from "../branchSchemas";
import type { BranchPayload, CmsBranch, OpeningHours } from "../branchTypes";
import BranchMapPicker from "./BranchMapPicker";

const BranchField = {
  name: "name",
  code: "code",
  dmsBranchId: "dms_branch_id",
  addressLine1: "address_line_1",
  addressLine2: "address_line_2",
  city: "city",
  phone: "phone",
  email: "email",
  latitude: "latitude",
  longitude: "longitude",
  saturdayWednesday: "saturday_wednesday",
  thursday: "thursday",
  friday: "friday",
  status: "status",
} as const;

const BranchFormText = {
  addTitle: "Add branch",
  editTitle: "Edit branch",
  addDescription: "Add a branch below.",
  editDescription: "Update the branch below.",
  loadError: "Could not load the branch.",
  createError: "Could not create the branch.",
  updateError: "Could not update the branch.",
  loading: "Loading branch",
  saving: "Saving...",
  submit: "Submit",
} as const;

type BranchFormModalProps = {
  open: boolean;
  branchId: number | null;
  onClose: () => void;
};

function blankToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function coordinateValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : null;
}

function coordinateText(value: number | null | undefined) {
  return value === null || value === undefined || Number.isNaN(value) ? "" : String(value);
}

function hourLabel(key: string) {
  return key
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("–");
}

function formFromBranch(branch: CmsBranch): { values: BranchFormValues; extra: ExtraHour[] } {
  const hours = splitOpeningHours(branch.opening_hours);
  return {
    values: {
      name: branch.name ?? "",
      code: branch.code ?? "",
      dms_branch_id: branch.dms_branch_id ?? "",
      address_line_1: branch.address_line_1 ?? "",
      address_line_2: branch.address_line_2 ?? "",
      city: branch.city ?? "",
      phone: branch.phone ?? "",
      email: branch.email ?? "",
      latitude: coordinateText(branch.latitude),
      longitude: coordinateText(branch.longitude),
      saturday_wednesday: hours.standard.saturday_wednesday,
      thursday: hours.standard.thursday,
      friday: hours.standard.friday,
      status: toRecordStatus(branch.status),
    },
    extra: hours.extra,
  };
}

function openingHoursPayload(values: BranchFormValues, extra: ExtraHour[]): OpeningHours | null {
  const hours: OpeningHours = {};
  const standard = [
    ["saturday_wednesday", values.saturday_wednesday],
    ["thursday", values.thursday],
    ["friday", values.friday],
  ] as const;
  for (const [key, value] of standard) {
    const text = value.trim();
    if (text) hours[key] = text;
  }
  for (const row of extra) {
    const key = row.key.trim();
    const text = row.value.trim();
    if (key && text && !(key in hours)) hours[key] = text;
  }
  return Object.keys(hours).length > 0 ? hours : null;
}

function toPayload(values: BranchFormValues, extra: ExtraHour[]): BranchPayload {
  return {
    name: values.name.trim(),
    code: values.code.trim(),
    dms_branch_id: blankToNull(values.dms_branch_id),
    address_line_1: values.address_line_1.trim(),
    address_line_2: blankToNull(values.address_line_2),
    city: values.city.trim(),
    phone: blankToNull(values.phone),
    email: blankToNull(values.email),
    latitude: coordinateValue(values.latitude),
    longitude: coordinateValue(values.longitude),
    opening_hours: openingHoursPayload(values, extra),
    status: values.status,
  };
}

export default function BranchFormModal({ open, branchId, onClose }: BranchFormModalProps) {
  const editing = branchId !== null;
  const waitForRefresh = useWaitForQueryRefresh();
  const [createBranch, createMutation] = useCreateBranchMutation();
  const [updateBranch, updateMutation] = useUpdateBranchMutation();
  const [refreshing, setRefreshing] = useState(false);
  const [extraHours, setExtraHours] = useState<ExtraHour[]>([]);
  const [formReady, setFormReady] = useState(false);
  const form = useSchemaForm(branchFormSchema, emptyBranchForm);
  const { reset, formState: { errors, isSubmitting } } = form;
  const detailQuery = useGetBranchQuery(branchId ?? 0, { skip: !open || !editing });
  const isSaving = createMutation.isLoading || updateMutation.isLoading || refreshing || isSubmitting;
  const isLoadingDetail = editing && (detailQuery.isLoading || detailQuery.isFetching) && !detailQuery.data;
  const addressLine1 = form.watch(BranchField.addressLine1);
  const addressLine2 = form.watch(BranchField.addressLine2);
  const city = form.watch(BranchField.city);
  const latitude = form.watch(BranchField.latitude);
  const longitude = form.watch(BranchField.longitude);
  const mapQuery = [addressLine1, addressLine2, city].map((part) => part.trim()).filter(Boolean).join(", ");

  useEffect(() => {
    if (!open) {
      setFormReady(false);
      return;
    }
    if (!editing) {
      reset(emptyBranchForm);
      setExtraHours([]);
      setFormReady(true);
      return;
    }
    if (detailQuery.data && detailQuery.data.id === branchId) {
      const next = formFromBranch(detailQuery.data);
      reset(next.values);
      setExtraHours(next.extra);
      setFormReady(true);
      return;
    }
    setFormReady(false);
  }, [branchId, detailQuery.data, editing, open, reset]);

  function setCoordinates(nextLatitude: string, nextLongitude: string) {
    form.setValue(BranchField.latitude, nextLatitude, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    form.setValue(BranchField.longitude, nextLongitude, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    form.clearErrors([BranchField.latitude, BranchField.longitude]);
  }

  async function submit(values: BranchFormValues) {
    if (isSaving || isLoadingDetail) return;
    try {
      const payload = toPayload(values, extraHours);
      const result = branchId === null
        ? await createBranch(payload).unwrap()
        : await updateBranch({ id: branchId, payload }).unwrap();
      setRefreshing(true);
      toast.success(result.message);
      await waitForRefresh();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, editing ? BranchFormText.updateError : BranchFormText.createError));
    } finally {
      setRefreshing(false);
    }
  }

  const detailError = detailQuery.isError ? getApiErrorMessage(detailQuery.error, BranchFormText.loadError) : null;

  return (
    <ModalBox
      open={open}
      title={editing ? BranchFormText.editTitle : BranchFormText.addTitle}
      description={editing ? BranchFormText.editDescription : BranchFormText.addDescription}
      onClose={onClose}
      size={ModalSize.lg}
      align={ModalAlign.center}
    >
      {isLoadingDetail || !formReady ? (
        <div className="flex items-center justify-center gap-3 py-8 text-sm text-slate-600">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-teal-700" />
          {BranchFormText.loading}
        </div>
      ) : (
        <form
          onSubmit={(event) => void form.submitForm(submit)(event)}
          className="grid gap-2 sm:grid-cols-2 [&_input]:h-8 [&_label]:gap-0.5 [&_select]:h-8"
          noValidate
        >
          {detailError ? <p className="text-sm text-rose-600 sm:col-span-2">{detailError}</p> : null}
          <div className="sm:col-span-2">
            <Field label="Name" error={errors.name?.message}>
              <FormInput form={form} name={BranchField.name} htmlName={BranchField.name} placeholder="Enter name" maxLength={150} disabled={isSaving} />
            </Field>
          </div>
          <Field label="Code" error={errors.code?.message}>
            <FormInput
              form={form}
              name={BranchField.code}
              htmlName={BranchField.code}
              placeholder="Enter code"
              maxLength={50}
              transform={(value) => value.toUpperCase()}
              disabled={isSaving}
            />
          </Field>
          <Field label="DMS branch ID" error={errors.dms_branch_id?.message}>
            <FormInput form={form} name={BranchField.dmsBranchId} htmlName={BranchField.dmsBranchId} placeholder="Titan DMS id" maxLength={100} disabled={isSaving} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address line 1" error={errors.address_line_1?.message}>
              <FormInput form={form} name={BranchField.addressLine1} htmlName={BranchField.addressLine1} placeholder="Street and plot" maxLength={255} disabled={isSaving} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Address line 2" error={errors.address_line_2?.message}>
              <FormInput form={form} name={BranchField.addressLine2} htmlName={BranchField.addressLine2} placeholder="Optional landmark" maxLength={255} disabled={isSaving} />
            </Field>
          </div>
          <Field label="City" error={errors.city?.message}>
            <FormInput form={form} name={BranchField.city} htmlName={BranchField.city} placeholder="Enter city" maxLength={100} disabled={isSaving} />
          </Field>
          <Field label="Phone" error={errors.phone?.message}>
            <FormInput form={form} name={BranchField.phone} htmlName={BranchField.phone} placeholder="+965 …" maxLength={30} disabled={isSaving} />
          </Field>
          <div className="sm:col-span-2">
            <BranchMapPicker
              query={mapQuery}
              canGeocode={addressLine1.trim().length >= 3 && city.trim().length >= 2}
              latitude={latitude}
              longitude={longitude}
              disabled={isSaving}
              onPick={setCoordinates}
            />
          </div>
          <Field label="Latitude" error={errors.latitude?.message}>
            <FormInput form={form} name={BranchField.latitude} htmlName={BranchField.latitude} placeholder="29.30154" inputMode="decimal" disabled={isSaving} />
          </Field>
          <Field label="Longitude" error={errors.longitude?.message}>
            <FormInput form={form} name={BranchField.longitude} htmlName={BranchField.longitude} placeholder="47.94362" inputMode="decimal" disabled={isSaving} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <FormInput form={form} name={BranchField.email} htmlName={BranchField.email} placeholder="name@example.com" maxLength={255} disabled={isSaving} />
          </Field>
          <Field label="Status">
            <StatusFormSelect form={form} name={BranchField.status} htmlName={BranchField.status} disabled={isSaving} />
          </Field>
          <div className="sm:col-span-2 mt-1 text-xs font-medium text-slate-700">Opening hours</div>
          <Field label="Saturday–Wednesday" error={errors.saturday_wednesday?.message}>
            <FormInput form={form} name={BranchField.saturdayWednesday} htmlName={BranchField.saturdayWednesday} placeholder="07:30 - 18:00" disabled={isSaving} />
          </Field>
          <Field label="Thursday" error={errors.thursday?.message}>
            <FormInput form={form} name={BranchField.thursday} htmlName={BranchField.thursday} placeholder="07:30 - 15:00" disabled={isSaving} />
          </Field>
          <Field label="Friday" error={errors.friday?.message}>
            <FormInput form={form} name={BranchField.friday} htmlName={BranchField.friday} placeholder="Closed" disabled={isSaving} />
          </Field>
          {extraHours.map((row, index) => (
            <Field key={`${row.key}-${index}`} label={hourLabel(row.key)}>
              <Input
                value={row.value}
                onChange={(value) => {
                  setExtraHours((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, value } : item));
                }}
                disabled={isSaving}
              />
            </Field>
          ))}
          <div className="sm:col-span-2">
            <Button variant={ButtonVariant.primary} type="submit" width="100%" height={34} disabled={isSaving || Boolean(detailError)}>
              {isSaving ? BranchFormText.saving : BranchFormText.submit}
            </Button>
          </div>
        </form>
      )}
    </ModalBox>
  );
}
