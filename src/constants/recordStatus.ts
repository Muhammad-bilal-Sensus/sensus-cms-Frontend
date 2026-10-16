export const recordStatuses = ["draft", "active", "inactive"] as const;

type RecordStatus = (typeof recordStatuses)[number];

export const recordStatusOptions: { value: RecordStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function toRecordStatus(value: string): RecordStatus {
  return (recordStatuses as readonly string[]).includes(value) ? value as RecordStatus : "active";
}
