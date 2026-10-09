import type {
  CmsUser, CreateUserPayload, FetchUsersParams, PageMeta, UpdateUserArgs, UserMutationResult, UsersListResult,
} from "@/features/users/userTypes";
import type { ApiEnvelope } from "@/types/api";
import { isRecord } from "@/utils/apiError";
import { API_PATH, ApiTag, HttpMethod, NO_RETRIES } from "../constants";
import { cmsApi } from "./baseApi";
import { isSuccessfulResponse, responseMessage, type MessageResponse } from "./response";

type UsersResponse = ApiEnvelope<CmsUser[]> & { meta: PageMeta };

export const userApi = cmsApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<UsersListResult, FetchUsersParams>({
      query: (filters) => {
        const params: Record<string, string | number> = {
          sort_by: filters.sortBy, sort_dir: filters.sortDir, per_page: filters.perPage, page: filters.page,
        };
        const search = filters.search?.trim();
        if (search) params.search = search;
        if (filters.roleId) params.role_id = Number(filters.roleId);
        if (filters.status) params.status = filters.status;
        return {
          url: API_PATH.Users, params,
          validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && isRecord(body) && Array.isArray(body.data) && !!body.meta,
        };
      },
      transformResponse: (body: UsersResponse) => ({ users: body.data, meta: body.meta }),
      extraOptions: { fallbackMessage: "Could not load users." },
      providesTags: [ApiTag.Users],
    }),
    createUser: builder.mutation<UserMutationResult, CreateUserPayload>({
      query: (body) => ({ url: API_PATH.Users, method: HttpMethod.Post, body, validateStatus: isSuccessfulResponse }),
      transformResponse: (body: ApiEnvelope<CmsUser>) => ({ user: body.data, message: responseMessage(body, "User created.") }),
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not create the user." },
      invalidatesTags: (_result, error) => error ? [] : [ApiTag.Users],
    }),
    updateUser: builder.mutation<UserMutationResult, UpdateUserArgs>({
      query: ({ id, payload }) => ({ url: API_PATH.Users + "/" + id, method: HttpMethod.Put, body: payload, validateStatus: isSuccessfulResponse }),
      transformResponse: (body: ApiEnvelope<CmsUser>) => ({ user: body.data, message: responseMessage(body, "User updated.") }),
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not update the user." },
      invalidatesTags: (_result, error) => error ? [] : [ApiTag.Users],
    }),
    deleteUser: builder.mutation<string, number>({
      query: (id) => ({ url: API_PATH.Users + "/" + id, method: HttpMethod.Delete, validateStatus: isSuccessfulResponse }),
      transformResponse: (body: MessageResponse) => responseMessage(body, "User deleted."),
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not delete the user." },
      invalidatesTags: (_result, error) => error ? [] : [ApiTag.Users],
    }),
  }),
});

export const { useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation } = userApi;
