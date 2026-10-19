import type {
  CmsMicrosite, CreateMicrositePayload, FetchMicrositesParams, MicrositeBranchLink, MicrositeBranchLinkStatus,
  MicrositeMutationResult, SyncMicrositeBranchesArgs, SyncMicrositeBranchesResult, UpdateMicrositeArgs,
} from "@/features/microsites/micrositeTypes";
import type { ApiEnvelope } from "@/types/api";
import { isRecord } from "@/utils/apiError";
import { API_PATH, ApiTag, HttpMethod, NO_RETRIES } from "../constants";
import { cmsApi } from "./baseApi";
import { hasDataField, isSuccessfulResponse, responseMessage, type MessageResponse } from "./response";

function readFlag(value: unknown) {
  return value === true || value === 1 || value === "1";
}

function readLinkStatus(value: unknown): MicrositeBranchLinkStatus {
  return value === "inactive" ? "inactive" : "active";
}

function readSortOrder(value: unknown) {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : 0;
  return Number.isFinite(number) ? Math.trunc(number) : 0;
}

function readLink(item: unknown): MicrositeBranchLink | null {
  if (!isRecord(item)) return null;
  const capabilities = isRecord(item.capabilities) ? item.capabilities : item;
  const branchId = typeof item.branch_id === "number" ? item.branch_id : typeof item.id === "number" ? item.id : null;
  if (branchId === null || !Number.isInteger(branchId)) return null;
  return {
    branch_id: branchId,
    supports_sales: readFlag(capabilities.supports_sales),
    supports_service: readFlag(capabilities.supports_service),
    supports_test_drive: readFlag(capabilities.supports_test_drive),
    sort_order: readSortOrder(capabilities.sort_order),
    status: readLinkStatus(capabilities.status),
  };
}

function linkItems(body: unknown): unknown[] {
  if (!isRecord(body)) return [];
  const data = body.data;
  if (Array.isArray(data)) return data;
  if (!isRecord(data)) return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.branches)) return data.branches;
  if (typeof data.id === "number") return [data];
  return [];
}

function isLinkListBody(body: unknown) {
  return linkItems(body).length > 0 || (isRecord(body) && (Array.isArray(body.data) || (isRecord(body.data) && (Array.isArray(body.data.data) || Array.isArray(body.data.branches)))));
}

function readLinks(body: unknown): MicrositeBranchLink[] {
  return linkItems(body).flatMap((item) => {
    const link = readLink(item);
    return link ? [link] : [];
  });
}

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
    getMicrositeBranches: builder.query<MicrositeBranchLink[], number>({
      query: (micrositeId) => ({
        url: API_PATH.Microsites + "/" + micrositeId + "/branches",
        validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && isLinkListBody(body),
      }),
      transformResponse: (body: unknown) => readLinks(body),
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not load linked locations." },
      providesTags: (_result, _error, micrositeId) => [{ type: ApiTag.Microsites, id: "branches-" + micrositeId }],
    }),
    syncMicrositeBranches: builder.mutation<SyncMicrositeBranchesResult, SyncMicrositeBranchesArgs>({
      query: ({ micrositeId, branches }) => ({
        url: API_PATH.Microsites + "/" + micrositeId + "/branches",
        method: HttpMethod.Put,
        body: { branches },
        validateStatus: (response, result: unknown) => isSuccessfulResponse(response, result) && isLinkListBody(result),
      }),
      transformResponse: (body: MessageResponse) => ({
        links: readLinks(body),
        message: responseMessage(body, "Microsite locations synchronized successfully."),
      }),
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not sync locations." },
      invalidatesTags: (_result, error, { micrositeId }) => error ? [] : [ApiTag.Microsites, { type: ApiTag.Microsites, id: "branches-" + micrositeId }],
    }),
  }),
});

export const {
  useGetMicrositesQuery, useGetMicrositeQuery, useCreateMicrositeMutation, useUpdateMicrositeMutation, useDeleteMicrositeMutation,
  useGetMicrositeBranchesQuery, useSyncMicrositeBranchesMutation,
} = micrositeApi;
