import type {
  CmsMicrosite, CreateMicrositePayload, FetchMicrositesParams, MicrositeMutationResult, UpdateMicrositeArgs,
} from "@/features/microsites/micrositeTypes";
import type { ApiEnvelope } from "@/types/api";
import { isRecord } from "@/utils/apiError";
import { API_PATH, ApiTag, HttpMethod, NO_RETRIES } from "../constants";
import { cmsApi } from "./baseApi";
import { hasDataField, isSuccessfulResponse, responseMessage, type MessageResponse } from "./response";

export const micrositeApi = cmsApi.injectEndpoints({
  endpoints: (builder) => ({
    getMicrosites: builder.query<CmsMicrosite[], FetchMicrositesParams>({
      query: ({ oemId }) => ({
        url: API_PATH.Microsites,
        params: { oem_id: oemId },
        validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && isRecord(body) && Array.isArray(body.data),
      }),
      transformResponse: (body: ApiEnvelope<CmsMicrosite[]>) => body.data,
      extraOptions: { fallbackMessage: "Could not load microsites." },
      providesTags: [ApiTag.Microsites],
    }),
    getMicrosite: builder.query<CmsMicrosite, number>({
      query: (id) => ({
        url: API_PATH.Microsites + "/" + id,
        validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && hasDataField(body, "id"),
      }),
      transformResponse: (body: ApiEnvelope<CmsMicrosite>) => body.data,
      extraOptions: { fallbackMessage: "Could not load the microsite." },
      providesTags: [ApiTag.Microsites],
    }),
    createMicrosite: builder.mutation<MicrositeMutationResult, CreateMicrositePayload>({
      query: (body) => ({
        url: API_PATH.Microsites,
        method: HttpMethod.Post,
        body,
        validateStatus: (response, result: unknown) => isSuccessfulResponse(response, result) && hasDataField(result, "id"),
      }),
      transformResponse: (body: ApiEnvelope<CmsMicrosite>) => ({ microsite: body.data, message: responseMessage(body, "Microsite created.") }),
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not create the microsite." },
      invalidatesTags: (_result, error) => error ? [] : [ApiTag.Microsites],
    }),
    updateMicrosite: builder.mutation<MicrositeMutationResult, UpdateMicrositeArgs>({
      query: ({ id, payload }) => ({
        url: API_PATH.Microsites + "/" + id,
        method: HttpMethod.Put,
        body: payload,
        validateStatus: (response, result: unknown) => isSuccessfulResponse(response, result) && hasDataField(result, "id"),
      }),
      transformResponse: (body: ApiEnvelope<CmsMicrosite>) => ({ microsite: body.data, message: responseMessage(body, "Microsite updated.") }),
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not update the microsite." },
      invalidatesTags: (_result, error) => error ? [] : [ApiTag.Microsites],
    }),
    deleteMicrosite: builder.mutation<string, number>({
      query: (id) => ({ url: API_PATH.Microsites + "/" + id, method: HttpMethod.Delete, validateStatus: isSuccessfulResponse }),
      transformResponse: (body: MessageResponse) => responseMessage(body, "Microsite deleted."),
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not delete the microsite." },
      invalidatesTags: (_result, error) => error ? [] : [ApiTag.Microsites],
    }),
  }),
});

export const {
  useGetMicrositesQuery, useGetMicrositeQuery, useCreateMicrositeMutation, useUpdateMicrositeMutation, useDeleteMicrositeMutation,
} = micrositeApi;
