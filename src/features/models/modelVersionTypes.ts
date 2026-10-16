import type { ModelStatus } from "./vehicleModelTypes";

export type VersionSection = {
  key: string;
  title: string;
  body: string;
};

export type CmsModelVersion = {
  id: number;
  model_id: number;
  name: string;
  code: string;
  model_year: number;
  launch_date: string | null;
  end_date: string | null;
  content_sections: VersionSection[];
  status: string;
  created_at: string | null;
};

export type FetchModelVersionsParams = {
  modelId: number;
  status?: string;
  modelYear?: number;
};

export type ModelVersionPayload = {
  model_id: number;
  name: string;
  code: string;
  model_year: number;
  launch_date: string | null;
  end_date: string | null;
  content_sections: VersionSection[] | null;
  status: ModelStatus;
};

export type ModelVersionMutationResult = {
  version: CmsModelVersion;
  message: string;
};
