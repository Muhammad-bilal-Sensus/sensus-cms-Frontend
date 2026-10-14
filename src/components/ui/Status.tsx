import type { FieldPathByValue, FieldValues, UseFormReturn } from "react-hook-form";
import { FormSelect } from "@/components/form/FormControls";
import Select from "@/components/ui/Select";

export const recordStatuses = ["draft", "active", "inactive"] as const;

export type RecordStatus = (typeof recordStatuses)[number];

export const recordStatusOptions: { value: RecordStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const statusTone: Record<string, string> = {
  draft: "bg-[#f7e3d7] text-[#bd672f]",
  active: "bg-[#dcecdf] text-[#287560]",
  inactive: "bg-slate-100 text-slate-500",
  published: "bg-[#dcecdf] text-[#287560]",
  suspended: "bg-[#f4dddd] text-[#b44850]",
};

export function toRecordStatus(value: string): RecordStatus {
  return (recordStatuses as readonly string[]).includes(value) ? value as RecordStatus : "active";
}

export function recordStatusLabel(status: string) {
  return recordStatusOptions.find((option) => option.value === status)?.label
    ?? (status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown");
}

export function StatusBadge({ status }: { status: string }) {
  const tone = statusTone[status] ?? "bg-slate-100 text-slate-500";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {recordStatusLabel(status)}
    </span>
  );
}

type StatusSelectProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
};

export function StatusSelect({ value, onChange, placeholder, disabled, name }: StatusSelectProps) {
  return (
    <Select
      value={value}
      onChange={onChange}
      options={recordStatusOptions}
      placeholder={placeholder}
      disabled={disabled}
      name={name}
    />
  );
}

type StatusFormSelectProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  name: FieldPathByValue<T, string>;
  htmlName?: string;
  disabled?: boolean;
};

export function StatusFormSelect<T extends FieldValues>({ form, name, htmlName, disabled }: StatusFormSelectProps<T>) {
  return <FormSelect form={form} name={name} htmlName={htmlName ?? name} options={recordStatusOptions} disabled={disabled} />;
}
