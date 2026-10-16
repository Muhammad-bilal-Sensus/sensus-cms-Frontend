export const mediaTypes = ["image", "video", "document", "360_spin"] as const;

export type MediaType = (typeof mediaTypes)[number];

export type MediaAssetStatus = "active" | "inactive";

export type CmsMediaAsset = {
  id: number;
  oem_id: number | null;
  file_name: string;
  media_type: string;
  mime_type: string;
  storage_key: string;
  url: string;
  title: string | null;
  alt_text: string | null;
  file_size_bytes: number | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  status: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type MediaPageMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type FetchMediaAssetsParams = {
  oemId?: number;
  mediaType?: MediaType;
  status?: MediaAssetStatus;
  search?: string;
  page?: number;
  perPage?: number;
};

export type MediaAssetsListResult = {
  assets: CmsMediaAsset[];
  meta: MediaPageMeta;
};

export type UploadMediaAssetPayload = {
  file: File;
  oemId?: number | null;
  title?: string | null;
  altText?: string | null;
  mediaType?: MediaType | null;
};

export type UploadMediaAssetResult = {
  asset: CmsMediaAsset;
  message: string;
};
