import type { CmsVehicleModel, FetchModelsParams, ModelMutationResult, ModelPayload } from "@/features/models/vehicleModelTypes";
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

function readSeo(value: unknown): CmsVehicleModel["seo"] {
  if (!isRecord(value)) return null;
  const keywords = Array.isArray(value.keywords)
    ? value.keywords.filter((keyword): keyword is string => typeof keyword === "string" && keyword.trim().length > 0)
    : [];
  return {
    meta_title: readText(value.meta_title),
    meta_description: readText(value.meta_description),
    keywords,
  };
}

function readModel(value: unknown): CmsVehicleModel | null {
  if (!isRecord(value)) return null;
  const id = readId(value.id);
  const oemId = readId(value.oem_id);
  if (id === null || oemId === null || typeof value.name !== "string" || typeof value.code !== "string") return null;
  return {
    id,
    oem_id: oemId,
    name: value.name,
    code: value.code,
    slug: readText(value.slug),
    body_type: typeof value.body_type === "string" ? value.body_type : "",
    short_description: readText(value.short_description),
    description: readText(value.description),
    seo: readSeo(value.seo),
    is_featured: value.is_featured === true || value.is_featured === 1 || value.is_featured === "1",
    sort_order: typeof value.sort_order === "number" ? value.sort_order : Number(value.sort_order) || 0,
    status: typeof value.status === "string" ? value.status : "draft",
    created_at: readText(value.created_at),
  };
}

function readModels(value: unknown): CmsVehicleModel[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const model = readModel(item);
    return model ? [model] : [];
  });
}

export const modelApi = cmsApi.injectEndpoints({
  endpoints: (builder) => ({
    getModels: builder.query<CmsVehicleModel[], FetchModelsParams>({
      query: (params) => {
        const search = new URLSearchParams();
        if (params.oemId) search.set("oem_id", String(params.oemId));
        if (params.status) search.set("status", params.status);
        if (typeof params.featured === "boolean") search.set("is_featured", params.featured ? "1" : "0");
        const query = search.toString();
        return {
          url: query ? `${API_PATH.Models}?${query}` : API_PATH.Models,
          validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && isRecord(body) && Array.isArray(body.data),
        };
      },
      transformResponse: (body: ApiEnvelope<unknown>) => readModels(body.data),
      extraOptions: { fallbackMessage: "Could not load models." },
      providesTags: [ApiTag.Models],
    }),
    getModel: builder.query<CmsVehicleModel, number>({
      query: (id) => ({
        url: API_PATH.Models + "/" + id,
        validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && hasDataField(body, "id"),
      }),
      transformResponse: (body: ApiEnvelope<unknown>) => {
        const model = readModel(body.data);
        if (!model) throw new Error("Could not load the model.");
        return model;
      },
      extraOptions: { fallbackMessage: "Could not load the model." },
      providesTags: [ApiTag.Models],
    }),
    createModel: builder.mutation<ModelMutationResult, ModelPayload>({
      query: (body) => ({
        url: API_PATH.Models,
        method: HttpMethod.Post,
        body,
        validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && hasDataField(body, "id"),
      }),
      transformResponse: (body: ApiEnvelope<unknown>) => {
        const model = readModel(body.data);
        if (!model) throw new Error("Could not create the model.");
        return { model, message: responseMessage(body, "Model created.") };
      },
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not create the model." },
      invalidatesTags: (_result, error) => error ? [] : [ApiTag.Models],
    }),
    updateModel: builder.mutation<ModelMutationResult, { id: number; payload: ModelPayload }>({
      query: ({ id, payload }) => ({
        url: API_PATH.Models + "/" + id,
        method: HttpMethod.Put,
        body: payload,
        validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && hasDataField(body, "id"),
      }),
      transformResponse: (body: ApiEnvelope<unknown>) => {
        const model = readModel(body.data);
        if (!model) throw new Error("Could not update the model.");
        return { model, message: responseMessage(body, "Model updated.") };
      },
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not update the model." },
      invalidatesTags: (_result, error) => error ? [] : [ApiTag.Models],
    }),
    deleteModel: builder.mutation<string, number>({
      query: (id) => ({
        url: API_PATH.Models + "/" + id,
        method: HttpMethod.Delete,
        validateStatus: isSuccessfulResponse,
      }),
      transformResponse: (body: MessageResponse) => responseMessage(body, "Model deleted."),
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not delete the model." },
      invalidatesTags: (_result, error) => error ? [] : [ApiTag.Models],
    }),
  }),
});

export const {
  useGetModelsQuery,
  useGetModelQuery,
  useCreateModelMutation,
  useUpdateModelMutation,
  useDeleteModelMutation,
} = modelApi;
