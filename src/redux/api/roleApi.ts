import { normalizeGroupedPermissions, normalizeRole } from "@/features/roles/roleMapper";
import type { CmsRole, GroupedPermissions, SaveRoleArgs } from "@/features/roles/roleTypes";
import type { ApiEnvelope } from "@/types/api";
import { isRecord } from "@/utils/apiError";
import { API_PATH, ApiErrorKind, ApiTag, HttpMethod, NO_RETRIES } from "../constants";
import { baseQuery as cmsApiBaseQuery } from "../store/baseQuery";
import { cmsApi } from "./baseApi";
import { hasDataField, isSuccessfulResponse, responseMessage, type MessageResponse } from "./response";

export const roleApi = cmsApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query<CmsRole[], void>({
      query: () => ({
        url: API_PATH.Roles,
        validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && isRecord(body) && Array.isArray(body.data),
      }),
      transformResponse: (body: ApiEnvelope<CmsRole[]>) => body.data.map(normalizeRole),
      extraOptions: { fallbackMessage: "Could not load roles." },
      providesTags: [ApiTag.Roles],
    }),
    getRole: builder.query<CmsRole, number>({
      query: (id) => ({
        url: API_PATH.Roles + "/" + id,
        validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && hasDataField(body, "id"),
      }),
      transformResponse: (body: ApiEnvelope<CmsRole>) => normalizeRole(body.data),
      extraOptions: { fallbackMessage: "Could not load the role." },
      providesTags: [ApiTag.Roles],
    }),
    getGroupedPermissions: builder.query<GroupedPermissions, void>({
      query: () => ({
        url: API_PATH.Permissions, params: { grouped: true },
        validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && isRecord(body) && isRecord(body.data),
      }),
      transformResponse: (body: ApiEnvelope<GroupedPermissions>) => normalizeGroupedPermissions(body.data),
      extraOptions: { fallbackMessage: "Could not load permissions." },
      providesTags: [ApiTag.Permissions],
    }),
    saveRole: builder.mutation<string, SaveRoleArgs>({
      async queryFn({ roleId, payload, permissionIds }, api, options) {
        const creating = roleId === undefined;
        const saved = await cmsApiBaseQuery({
          url: creating ? API_PATH.Roles : API_PATH.Roles + "/" + roleId,
          method: creating ? HttpMethod.Post : HttpMethod.Put,
          body: payload,
          validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && (!creating || hasDataField(body, "id")),
        }, api, { ...options, fallbackMessage: creating ? "Could not create the role." : "Could not update the role." });
        if (saved.error) return { error: saved.error };

        const savedBody = saved.data as ApiEnvelope<CmsRole>;
        const savedRoleId = creating ? savedBody.data.id : roleId;
        const synced = await cmsApiBaseQuery({
          url: API_PATH.Roles + "/" + savedRoleId + "/permissions",
          method: HttpMethod.Put, body: { permission_ids: permissionIds }, validateStatus: isSuccessfulResponse,
        }, api, { ...options, fallbackMessage: "Could not save permissions." });
        if (synced.error) {
          return { error: creating ? { kind: ApiErrorKind.PermissionSync, roleId: savedRoleId, message: synced.error.message } : synced.error };
        }
        return { data: responseMessage(synced.data as MessageResponse, "Permissions saved.") };
      },
      extraOptions: { maxRetries: NO_RETRIES },
      invalidatesTags: (_result, error) => !error || error.kind === ApiErrorKind.PermissionSync ? [ApiTag.Roles] : [],
    }),
    deleteRole: builder.mutation<string, number>({
      query: (id) => ({ url: API_PATH.Roles + "/" + id, method: HttpMethod.Delete, validateStatus: isSuccessfulResponse }),
      transformResponse: (body: MessageResponse) => responseMessage(body, "Role deleted."),
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not delete the role." },
      invalidatesTags: (_result, error) => error ? [] : [ApiTag.Roles],
    }),
  }),
});

export const { useGetRolesQuery, useGetRoleQuery, useGetGroupedPermissionsQuery, useSaveRoleMutation, useDeleteRoleMutation } = roleApi;
