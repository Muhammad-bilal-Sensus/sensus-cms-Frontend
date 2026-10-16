import type { CmsModelTrim, FetchModelTrimsParams, ModelTrimMutationResult, ModelTrimPayload } from "@/features/models/modelTrimTypes";
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

function readPrice(value: unknown, fallback: unknown): number | null {
  const amount = typeof value === "number" ? value : typeof fallback === "number" ? fallback : Number(fallback ?? value);
  return Number.isFinite(amount) ? amount : null;
}

function readTrim(value: unknown): CmsModelTrim | null {
  if (!isRecord(value)) return null;
  const id = readId(value.id);
  const versionId = readId(value.model_version_id);
  const price = readPrice(value.price_float, value.price);
  if (id === null || versionId === null || price === null || typeof value.name !== "string" || typeof value.code !== "string") return null;
  return {
    id,
    model_version_id: versionId,
    name: value.name,
    code: value.code,
    powertrain_type: typeof value.powertrain_type === "string" ? value.powertrain_type : "",
    price,
    currency_code: typeof value.currency_code === "string" && value.currency_code.trim() ? value.currency_code : "KWD",
    description: readText(value.description),
    sort_order: typeof value.sort_order === "number" ? value.sort_order : Number(value.sort_order) || 0,
    status: typeof value.status === "string" ? value.status : "draft",
    created_at: readText(value.created_at),
  };
}

function readTrims(value: unknown): CmsModelTrim[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const trim = readTrim(item);
    return trim ? [trim] : [];
  });
}

export const modelTrimApi = cmsApi.injectEndpoints({
  endpoints: (builder) => ({
    getModelTrims: builder.query<CmsModelTrim[], FetchModelTrimsParams>({
      query: (params) => {
        const search = new URLSearchParams();
        search.set("model_version_id", String(params.versionId));
        if (params.status) search.set("status", params.status);
        if (params.powertrain) search.set("powertrain_type", params.powertrain);
        return {
          url: `${API_PATH.ModelTrims}?${search.toString()}`,
          validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && isRecord(body) && Array.isArray(body.data),
        };
      },
      transformResponse: (body: ApiEnvelope<unknown>) => readTrims(body.data),
      extraOptions: { fallbackMessage: "Could not load trims." },
      providesTags: [ApiTag.ModelTrims],
    }),
    getModelTrim: builder.query<CmsModelTrim, number>({
      query: (id) => ({
        url: API_PATH.ModelTrims + "/" + id,
        validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && hasDataField(body, "id"),
      }),
      transformResponse: (body: ApiEnvelope<unknown>) => {
        const trim = readTrim(body.data);
        if (!trim) throw new Error("Could not load the trim.");
        return trim;
      },
      extraOptions: { fallbackMessage: "Could not load the trim." },
      providesTags: [ApiTag.ModelTrims],
    }),
    createModelTrim: builder.mutation<ModelTrimMutationResult, ModelTrimPayload>({
      query: (body) => ({
        url: API_PATH.ModelTrims,
        method: HttpMethod.Post,
        body,
        validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && hasDataField(body, "id"),
      }),
      transformResponse: (body: ApiEnvelope<unknown>) => {
        const trim = readTrim(body.data);
        if (!trim) throw new Error("Could not create the trim.");
        return { trim, message: responseMessage(body, "Trim created.") };
      },
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not create the trim." },
      invalidatesTags: (_result, error) => error ? [] : [ApiTag.ModelTrims],
    }),
    updateModelTrim: builder.mutation<ModelTrimMutationResult, { id: number; payload: ModelTrimPayload }>({
      query: ({ id, payload }) => ({
        url: API_PATH.ModelTrims + "/" + id,
        method: HttpMethod.Put,
        body: payload,
        validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && hasDataField(body, "id"),
      }),
      transformResponse: (body: ApiEnvelope<unknown>) => {
        const trim = readTrim(body.data);
        if (!trim) throw new Error("Could not update the trim.");
        return { trim, message: responseMessage(body, "Trim updated.") };
      },
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not update the trim." },
      invalidatesTags: (_result, error) => error ? [] : [ApiTag.ModelTrims],
    }),
    deleteModelTrim: builder.mutation<string, number>({
      query: (id) => ({
        url: API_PATH.ModelTrims + "/" + id,
        method: HttpMethod.Delete,
        validateStatus: isSuccessfulResponse,
      }),
      transformResponse: (body: MessageResponse) => responseMessage(body, "Trim deleted."),
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not delete the trim." },
      invalidatesTags: (_result, error) => error ? [] : [ApiTag.ModelTrims],
    }),
  }),
});

export const {
  useGetModelTrimsQuery,
  useGetModelTrimQuery,
  useCreateModelTrimMutation,
  useUpdateModelTrimMutation,
  useDeleteModelTrimMutation,
} = modelTrimApi;
