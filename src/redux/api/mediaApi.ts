import { createMediaUploadBody } from "@/features/media/mediaService";
import type {
  CmsMediaAsset, FetchMediaAssetsParams, MediaAssetsListResult, MediaPageMeta, UploadMediaAssetPayload, UploadMediaAssetResult,
} from "@/features/media/mediaTypes";
import type { ApiEnvelope } from "@/types/api";
import { isRecord } from "@/utils/apiError";
import { API_PATH, ApiTag, HttpMethod, NO_RETRIES } from "../constants";
import { cmsApi } from "./baseApi";
import { hasDataField, isSuccessfulResponse, responseMessage, type MessageResponse } from "./response";

type MediaListResponse = ApiEnvelope<CmsMediaAsset[]> & { meta: MediaPageMeta };

function isMediaListBody(body: unknown) {
  return isRecord(body) && Array.isArray(body.data) && isRecord(body.meta);
}

export const mediaApi = cmsApi.injectEndpoints({
  endpoints: (builder) => ({
    getMediaAssets: builder.query<MediaAssetsListResult, FetchMediaAssetsParams | void>({
      query: (filters) => {
        const params: Record<string, string | number> = {};
        if (filters?.oemId) params.oem_id = filters.oemId;
        if (filters?.mediaType) params.media_type = filters.mediaType;
        if (filters?.status) params.status = filters.status;
        const search = filters?.search?.trim();
        if (search) params.search = search;
        if (filters?.page) params.page = filters.page;
        if (filters?.perPage) params.per_page = filters.perPage;
        return {
          url: API_PATH.MediaAssets,
          params,
          validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && isMediaListBody(body),
        };
      },
      transformResponse: (body: MediaListResponse) => ({ assets: body.data, meta: body.meta }),
      extraOptions: { fallbackMessage: "Could not load media." },
      providesTags: [ApiTag.MediaAssets],
    }),
    uploadMediaAsset: builder.mutation<UploadMediaAssetResult, UploadMediaAssetPayload>({
      query: (payload) => ({
        url: API_PATH.MediaAssets,
        method: HttpMethod.Post,
        body: createMediaUploadBody(payload),
        validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && hasDataField(body, "id"),
      }),
      transformResponse: (body: ApiEnvelope<CmsMediaAsset>) => ({
        asset: body.data,
        message: responseMessage(body, "Media asset uploaded successfully."),
      }),
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not upload the file." },
      invalidatesTags: (_result, error) => error ? [] : [ApiTag.MediaAssets],
    }),
    deleteMediaAsset: builder.mutation<string, number>({
      query: (id) => ({
        url: API_PATH.MediaAssets + "/" + id,
        method: HttpMethod.Delete,
        validateStatus: isSuccessfulResponse,
      }),
      transformResponse: (body: MessageResponse) => responseMessage(body, "Media asset deleted successfully."),
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not delete the file." },
      invalidatesTags: (_result, error) => error ? [] : [ApiTag.MediaAssets],
    }),
  }),
});

export const {
  useGetMediaAssetsQuery, useUploadMediaAssetMutation, useDeleteMediaAssetMutation,
} = mediaApi;
