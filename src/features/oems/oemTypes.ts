import { recordStatuses, toRecordStatus } from "@/constants/recordStatus";
import type { RecordStatus } from "@/types/recordStatus";

export const oemStatuses = recordStatuses;

export type OemStatus = RecordStatus;

export const toOemStatus = toRecordStatus;

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
