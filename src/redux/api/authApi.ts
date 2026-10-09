import type { ApiUser, LoginData, LoginPayload, LoginResult, ResetPasswordPayload, VerifyOtpPayload } from "@/features/auth/authTypes";
import type { ApiEnvelope } from "@/types/api";
import { API_PATH, ApiTag, HttpMethod, NO_RETRIES } from "../constants";
import { cmsApi } from "./baseApi";
import { hasDataField, isSuccessfulResponse, responseMessage, type MessageResponse } from "./response";

export const authApi = cmsApi.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<ApiUser, void>({
      query: () => ({
        url: API_PATH.Me,
        validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && hasDataField(body, "email"),
      }),
      transformResponse: (body: ApiEnvelope<ApiUser>) => body.data,
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not load your profile." },
      providesTags: [ApiTag.Auth],
    }),
    login: builder.mutation<LoginResult, LoginPayload>({
      query: ({ email, password }) => ({
        url: API_PATH.Login, method: HttpMethod.Post, body: { email: email.trim(), password },
        validateStatus: (response, body: unknown) => isSuccessfulResponse(response, body) && hasDataField(body, "token") && hasDataField(body, "user"),
      }),
      transformResponse: (body: ApiEnvelope<LoginData>) => ({ ...body.data, message: responseMessage(body, "Login successful.") }),
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Login failed." },
    }),
    logout: builder.mutation<string, void>({
      query: () => ({ url: API_PATH.Logout, method: HttpMethod.Post, validateStatus: isSuccessfulResponse }),
      transformResponse: (body: MessageResponse) => responseMessage(body, "Logged out."),
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Logout failed." },
    }),
    forgotPassword: builder.mutation<string, string>({
      query: (email) => ({
        url: API_PATH.ForgotPassword, method: HttpMethod.Post, body: { email: email.trim() }, validateStatus: isSuccessfulResponse,
      }),
      transformResponse: (body: MessageResponse) => responseMessage(body, "Could not send the code."),
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not send the code." },
    }),
    verifyOtp: builder.mutation<string, VerifyOtpPayload>({
      query: ({ email, otp }) => ({
        url: API_PATH.VerifyOtp, method: HttpMethod.Post, body: { email: email.trim(), otp }, validateStatus: isSuccessfulResponse,
      }),
      transformResponse: (body: MessageResponse) => responseMessage(body, "Could not verify the code."),
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not verify the code." },
    }),
    resetPassword: builder.mutation<string, ResetPasswordPayload>({
      query: (payload) => ({
        url: API_PATH.ResetPassword, method: HttpMethod.Post, body: { ...payload, email: payload.email.trim() }, validateStatus: isSuccessfulResponse,
      }),
      transformResponse: (body: MessageResponse) => responseMessage(body, "Could not reset the password."),
      extraOptions: { maxRetries: NO_RETRIES, fallbackMessage: "Could not reset the password." },
    }),
  }),
});

export const {
  useGetMeQuery, useLazyGetMeQuery, useLoginMutation, useLogoutMutation,
  useForgotPasswordMutation, useVerifyOtpMutation, useResetPasswordMutation,
} = authApi;
