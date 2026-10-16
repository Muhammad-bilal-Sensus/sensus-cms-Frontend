import type { CmsModelVersion, FetchModelVersionsParams, ModelVersionMutationResult, ModelVersionPayload, VersionSection } from "@/features/models/modelVersionTypes";
import type { ApiEnvelope } from "@/types/api";
import { isRecord } from "@/utils/apiError";
import { API_PATH, ApiTag, HttpMethod, NO_RETRIES } from "../constants";
import { cmsApi } from "./baseApi";
import { hasDataField, isSuccessfulResponse, responseMessage, type MessageResponse } from "./response";

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function readId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return null;
}

function readDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const date = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

function readSections(value: unknown): VersionSection[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const title = typeof item.title === "string" ? item.title : "";
    const body = typeof item.body === "string" ? item.body : "";
    const key = typeof item.key === "string" && item.key.trim() ? item.key : title;
    if (!key && !title && !body) return [];
    return [{ key, title, body }];
  });
}

function readVersion(value: unknown): CmsModelVersion | null {
  if (!isRecord(value)) return null;
  const id = readId(value.id);
  const modelId = readId(value.model_id);
  const year = typeof value.model_year === "number" ? value.model_year : Number(value.model_year);
  if (id === null || modelId === null || typeof value.name !== "string" || typeof value.code !== "string" || !Number.isInteger(year)) return null;
  return {
    id,
    model_id: modelId,
    name: value.name,
    code: value.code,
    model_year: year,
    launch_date: readDate(value.launch_date),
    end_date: readDate(value.end_date),
    content_sections: readSections(value.content_sections),
    status: typeof value.status === "string" ? value.status : "draft",
    created_at: readText(value.created_at),
  };
}

function readVersions(value: unknown): CmsModelVersion[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const version = readVersion(item);
    return version ? [version] : [];
  });
}

export const modelVersionApi = cmsApi.injectEndpoints({
  endpoints: (builder) => ({
    getModelVersions: builder.query<CmsModelVersion[], FetchModelVersionsParams>({
      query: (params) => {
        const search = new URLSearchParams();
        search.set("model_id", String(params.modelId));
        if (params.status) search.set("status", params.status);
        if (params.modelYear) search.set("model_year", String(params.modelYear));
        return {
          url: `${API_PATH.ModelVersions}?${search.toString()}`,
          validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && isRecord(body) && Array.isArray(body.data),
        };
      },
      transformResponse: (body: ApiEnvelope<unknown>) => readVersions(body.data),
      extraOptions: { fallbackMessage: "Could not load versions." },
      providesTags: [ApiTag.ModelVersions],
    }),
    getModelVersion: builder.query<CmsModelVersion, number>({
      query: (id) => ({
        url: API_PATH.ModelVersions + "/" + id,
        validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && hasDataField(body, "id"),
      }),
      transformResponse: (body: ApiEnvelope<unknown>) => {
        const version = readVersion(body.data);
        if (!version) throw new Error("Could not load the version.");
        return version;
      },
      extraOptions: { fallbackMessage: "Could not load the version." },
      providesTags: [ApiTag.ModelVersions],
    }),
    createModelVersion: builder.mutation<ModelVersionMutationResult, ModelVersionPayload>({
      query: (body) => ({
        url: API_PATH.ModelVersions,
        method: HttpMethod.Post,
        body,
        validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && hasDataField(body, "id"),
      }),
      transformResponse: (body: ApiEnvelope<unknown>) => {
        const version = readVersion(body.data);
        if (!version) throw new Error("Could not create the version.");
        return { version, message: responseMessage(body, "Version created.") };
      },
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not create the version." },
      invalidatesTags: (_result, error) => error ? [] : [ApiTag.ModelVersions],
    }),
    updateModelVersion: builder.mutation<ModelVersionMutationResult, { id: number; payload: ModelVersionPayload }>({
      query: ({ id, payload }) => ({
        url: API_PATH.ModelVersions + "/" + id,
        method: HttpMethod.Put,
        body: payload,
        validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && hasDataField(body, "id"),
      }),
      transformResponse: (body: ApiEnvelope<unknown>) => {
        const version = readVersion(body.data);
        if (!version) throw new Error("Could not update the version.");
        return { version, message: responseMessage(body, "Version updated.") };
      },
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not update the version." },
      invalidatesTags: (_result, error) => error ? [] : [ApiTag.ModelVersions],
    }),
    deleteModelVersion: builder.mutation<string, number>({
      query: (id) => ({
        url: API_PATH.ModelVersions + "/" + id,
        method: HttpMethod.Delete,
        validateStatus: isSuccessfulResponse,
      }),
      transformResponse: (body: MessageResponse) => responseMessage(body, "Version deleted."),
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not delete the version." },
      invalidatesTags: (_result, error) => error ? [] : [ApiTag.ModelVersions],
    }),
  }),
});

export const {
  useGetModelVersionsQuery,
  useGetModelVersionQuery,
  useCreateModelVersionMutation,
  useUpdateModelVersionMutation,
  useDeleteModelVersionMutation,
} = modelVersionApi;
