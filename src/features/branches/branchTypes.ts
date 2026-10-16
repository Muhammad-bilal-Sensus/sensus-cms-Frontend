import type { RecordStatus } from "@/types/recordStatus";

export type BranchStatus = RecordStatus;

export type OpeningHours = Record<string, string>;

export type CmsBranch = {
  id: number;
  name: string;
  code: string;
  dms_branch_id: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_hours: OpeningHours | null;
  status: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type BranchPayload = {
  name: string;
  code: string;
  dms_branch_id: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_hours: OpeningHours | null;
  status: BranchStatus;
};

export type BranchMutationResult = { branch: CmsBranch; message: string };
export type UpdateBranchArgs = { id: number; payload: BranchPayload };
export type BranchSortBy = "name" | "code" | "city" | "phone" | "status";
export type BranchSortDir = "asc" | "desc";
export type FetchBranchesParams = {
  city?: string;
  status?: string;
  sortBy?: BranchSortBy;
  sortDir?: BranchSortDir;
};
