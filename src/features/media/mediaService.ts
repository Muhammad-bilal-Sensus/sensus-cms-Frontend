import type { UploadMediaAssetPayload } from "./mediaTypes";

export function createMediaUploadBody(payload: UploadMediaAssetPayload) {
  const body = new FormData();
  body.append("file", payload.file);
  if (payload.oemId) body.append("oem_id", String(payload.oemId));
  const title = payload.title?.trim();
  const altText = payload.altText?.trim();
  if (title) body.append("title", title);
  if (altText) body.append("alt_text", altText);
  if (payload.mediaType) body.append("media_type", payload.mediaType);
  return body;
}
