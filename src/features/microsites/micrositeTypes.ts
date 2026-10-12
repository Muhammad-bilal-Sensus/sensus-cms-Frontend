import type { OemStatus } from "@/features/oems/oemTypes";

export type MicrositeSettings = {
  locale?: string;
  fallback_locale?: string;
  currency?: string;
  contact_email?: string;
  theme?: string;
  [key: string]: string | undefined;
};

export type CmsMicrosite = {
  id: number;
  oem_id: number;
  name: string;
  slug: string;
  domain: string;
  settings: MicrositeSettings | null;
  status: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type MicrositeSettingsPayload = Record<string, string>;

export type CreateMicrositePayload = {
  oem_id: number;
  name: string;
  slug?: string;
  domain: string;
  settings: MicrositeSettingsPayload;
  status: OemStatus;
};

export type UpdateMicrositePayload = Omit<CreateMicrositePayload, "oem_id">;

export type MicrositeMutationResult = { microsite: CmsMicrosite; message: string };
export type UpdateMicrositeArgs = { id: number; payload: UpdateMicrositePayload };
export type FetchMicrositesParams = { oemId: number };
