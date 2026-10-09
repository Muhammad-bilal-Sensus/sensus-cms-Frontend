import type { CmsOem, OemMutationResult, OemPayload, UpdateOemArgs } from "@/features/oems/oemTypes";
import type { ApiEnvelope } from "@/types/api";
import { isRecord } from "@/utils/apiError";
import { API_PATH, ApiTag, HttpMethod, NO_RETRIES } from "../constants";
import { cmsApi } from "./baseApi";
import { hasDataField, isSuccessfulResponse, responseMessage, type MessageResponse } from "./response";

export const oemApi = cmsApi.injectEndpoints({
  endpoints: (builder) => ({
    getOems: builder.query<CmsOem[], void>({
      query: () => ({
        url: API_PATH.Oems,
        validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && isRecord(body) && Array.isArray(body.data),
      }),
      transformResponse: (body: ApiEnvelope<CmsOem[]>) => body.data,
      extraOptions: { fallbackMessage: "Could not load OEMs." },
      providesTags: [ApiTag.Oems],
    }),
    getOem: builder.query<CmsOem, number>({
      query: (id) => ({
        url: API_PATH.Oems + "/" + id,
        validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && hasDataField(body, "id"),
      }),
      transformResponse: (body: ApiEnvelope<CmsOem>) => body.data,
      extraOptions: { fallbackMessage: "Could not load the OEM." },
      providesTags: [ApiTag.Oems],
    }),
    createOem: builder.mutation<OemMutationResult, OemPayload>({
      query: (body) => ({
        url: API_PATH.Oems,
        method: HttpMethod.Post,
        body,
        validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && hasDataField(body, "id"),
      }),
      transformResponse: (body: ApiEnvelope<CmsOem>) => ({ oem: body.data, message: responseMessage(body, "OEM created.") }),
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not create the OEM." },
      invalidatesTags: (_result, error) => error ? [] : [ApiTag.Oems],
    }),
    updateOem: builder.mutation<OemMutationResult, UpdateOemArgs>({
      query: ({ id, payload }) => ({
        url: API_PATH.Oems + "/" + id,
        method: HttpMethod.Put,
        body: payload,
        validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && hasDataField(body, "id"),
      }),
      transformResponse: (body: ApiEnvelope<CmsOem>) => ({ oem: body.data, message: responseMessage(body, "OEM updated.") }),
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not update the OEM." },
      invalidatesTags: (_result, error) => error ? [] : [ApiTag.Oems],
    }),
    deleteOem: builder.mutation<string, number>({
      query: (id) => ({ url: API_PATH.Oems + "/" + id, method: HttpMethod.Delete, validateStatus: isSuccessfulResponse }),
      transformResponse: (body: MessageResponse) => responseMessage(body, "OEM deleted."),
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not delete the OEM." },
      invalidatesTags: (_result, error) => error ? [] : [ApiTag.Oems],
    }),
  }),
});

export const { useGetOemsQuery, useGetOemQuery, useCreateOemMutation, useUpdateOemMutation, useDeleteOemMutation } = oemApi;
