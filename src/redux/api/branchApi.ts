import type {
  BranchMutationResult, BranchPayload, CmsBranch, FetchBranchesParams, UpdateBranchArgs,
} from "@/features/branches/branchTypes";
import type { ApiEnvelope } from "@/types/api";
import { isRecord } from "@/utils/apiError";
import { API_PATH, ApiTag, HttpMethod, NO_RETRIES } from "../constants";
import { cmsApi } from "./baseApi";
import { hasDataField, isSuccessfulResponse, responseMessage, type MessageResponse } from "./response";

function isBranchListBody(body: unknown) {
  if (!isRecord(body)) return false;
  const data = body.data;
  if (Array.isArray(data)) return true;
  return isRecord(data) && (Array.isArray(data.data) || typeof data.id === "number");
}

function readBranches(body: unknown): CmsBranch[] {
  if (!isRecord(body)) return [];
  const data = body.data;
  if (Array.isArray(data)) return data as CmsBranch[];
  if (isRecord(data) && Array.isArray(data.data)) return data.data as CmsBranch[];
  if (isRecord(data) && typeof data.id === "number") return [data as CmsBranch];
  return [];
}

export const branchApi = cmsApi.injectEndpoints({
  endpoints: (builder) => ({
    getBranches: builder.query<CmsBranch[], FetchBranchesParams>({
      query: (filters) => {
        const params: Record<string, string> = {};
        const city = filters.city?.trim();
        if (city) params.city = city;
        if (filters.status) params.status = filters.status;
        if (filters.sortBy) params.sort_by = filters.sortBy;
        if (filters.sortDir) params.sort_dir = filters.sortDir;
        return {
          url: API_PATH.Branches,
          params,
          validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && isBranchListBody(body),
        };
      },
      transformResponse: (body: unknown) => readBranches(body),
      extraOptions: { fallbackMessage: "Could not load branches." },
      providesTags: [ApiTag.Branches],
    }),
    getBranch: builder.query<CmsBranch, number>({
      query: (id) => ({
        url: API_PATH.Branches + "/" + id,
        validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && hasDataField(body, "id"),
      }),
      transformResponse: (body: ApiEnvelope<CmsBranch>) => body.data,
      extraOptions: { fallbackMessage: "Could not load the branch." },
      providesTags: [ApiTag.Branches],
    }),
    createBranch: builder.mutation<BranchMutationResult, BranchPayload>({
      query: (body) => ({
        url: API_PATH.Branches,
        method: HttpMethod.Post,
        body,
        validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && hasDataField(body, "id"),
      }),
      transformResponse: (body: ApiEnvelope<CmsBranch>) => ({ branch: body.data, message: responseMessage(body, "Branch created.") }),
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not create the branch." },
      invalidatesTags: (_result, error) => error ? [] : [ApiTag.Branches],
    }),
    updateBranch: builder.mutation<BranchMutationResult, UpdateBranchArgs>({
      query: ({ id, payload }) => ({
        url: API_PATH.Branches + "/" + id,
        method: HttpMethod.Put,
        body: payload,
        validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && hasDataField(body, "id"),
      }),
      transformResponse: (body: ApiEnvelope<CmsBranch>) => ({ branch: body.data, message: responseMessage(body, "Branch updated.") }),
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not update the branch." },
      invalidatesTags: (_result, error) => error ? [] : [ApiTag.Branches],
    }),
    deleteBranch: builder.mutation<string, number>({
      query: (id) => ({ url: API_PATH.Branches + "/" + id, method: HttpMethod.Delete, validateStatus: isSuccessfulResponse }),
      transformResponse: (body: MessageResponse) => responseMessage(body, "Branch deleted."),
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not delete the branch." },
      invalidatesTags: (_result, error) => error ? [] : [ApiTag.Branches],
    }),
  }),
});

export const {
  useGetBranchesQuery, useGetBranchQuery, useCreateBranchMutation, useUpdateBranchMutation, useDeleteBranchMutation,
} = branchApi;
