export const modelStatuses = ["draft", "active", "inactive", "discontinued"] as const;

export type ModelStatus = (typeof modelStatuses)[number];

export const modelStatusOptions: { value: ModelStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "discontinued", label: "Discontinued" },
];

export type ModelSeo = {
  meta_title: string | null;
  meta_description: string | null;
  keywords: string[];
};

export type CmsVehicleModel = {
  id: number;
  oem_id: number;
  name: string;
  code: string;
  slug: string | null;
  body_type: string;
  short_description: string | null;
  description: string | null;
  seo: ModelSeo | null;
  is_featured: boolean;
  sort_order: number;
  status: string;
  created_at: string | null;
};

export type FetchModelsParams = {
  oemId?: number;
  status?: string;
  featured?: boolean;
};

export type ModelPayload = {
  oem_id: number;
  name: string;
  code: string;
  slug: string | null;
  body_type: string;
  short_description: string | null;
  description: string | null;
  seo: ModelSeo | null;
  is_featured: boolean;
  sort_order: number;
  status: ModelStatus;
};

export type ModelMutationResult = {
  model: CmsVehicleModel;
  message: string;
};

export function toModelStatus(value: string): ModelStatus {
  return (modelStatuses as readonly string[]).includes(value) ? value as ModelStatus : "draft";
}
