export const oemStatuses = ["active", "inactive", "draft"] as const;

export type OemStatus = (typeof oemStatuses)[number];

export const oemStatusOptions: { value: OemStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "draft", label: "Draft" },
];

export const oemStatusTone: Record<OemStatus, string> = {
  active: "bg-[#dcecdf] text-[#287560]",
  inactive: "bg-slate-100 text-slate-500",
  draft: "bg-[#f7e3d7] text-[#bd672f]",
};

export function toOemStatus(value: string): OemStatus {
  return (oemStatuses as readonly string[]).includes(value) ? value as OemStatus : "active";
}

export function oemStatusLabel(status: string) {
  return oemStatusOptions.find((option) => option.value === status)?.label
    ?? (status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown");
}

export type CmsOem = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type OemPayload = {
  name: string;
  code: string;
  description: string;
  status: OemStatus;
};

export type OemMutationResult = { oem: CmsOem; message: string };
export type UpdateOemArgs = { id: number; payload: OemPayload };
