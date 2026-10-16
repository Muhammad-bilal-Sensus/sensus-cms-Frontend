export const trimStatuses = ["draft", "active", "inactive"] as const;

export type TrimStatus = (typeof trimStatuses)[number];

export const trimStatusOptions: { value: TrimStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const powertrainTypes = ["BEV", "REEV", "PHEV", "ICE"] as const;

export type PowertrainType = (typeof powertrainTypes)[number];

export const powertrainOptions: { value: PowertrainType; label: string }[] = [
  { value: "BEV", label: "BEV" },
  { value: "REEV", label: "REEV" },
  { value: "PHEV", label: "PHEV" },
  { value: "ICE", label: "ICE" },
];

export type CmsModelTrim = {
  id: number;
  model_version_id: number;
  name: string;
  code: string;
  powertrain_type: string;
  price: number;
  currency_code: string;
  description: string | null;
  sort_order: number;
  status: string;
  created_at: string | null;
};

export type FetchModelTrimsParams = {
  versionId: number;
  status?: string;
  powertrain?: string;
};

export type ModelTrimPayload = {
  model_version_id: number;
  name: string;
  code: string;
  powertrain_type: PowertrainType;
  price: number;
  currency_code: string;
  description: string | null;
  sort_order: number;
  status: TrimStatus;
};

export type ModelTrimMutationResult = {
  trim: CmsModelTrim;
  message: string;
};

export function toTrimStatus(value: string): TrimStatus {
  return (trimStatuses as readonly string[]).includes(value) ? value as TrimStatus : "draft";
}

export function toPowertrain(value: string): PowertrainType {
  return (powertrainTypes as readonly string[]).includes(value) ? value as PowertrainType : "BEV";
}
