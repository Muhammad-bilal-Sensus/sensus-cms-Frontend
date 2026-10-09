import { createApi } from "@reduxjs/toolkit/query/react";
import { ApiTag, QUERY_CACHE_SECONDS } from "../constants";
import { baseQuery } from "../store/baseQuery";

export const cmsApi = createApi({
  reducerPath: "cmsApi",
  baseQuery,
  tagTypes: Object.values(ApiTag),
  keepUnusedDataFor: QUERY_CACHE_SECONDS,
  // Wait for in-flight reads before invalidating, so an older response cannot
  // replace the refreshed list after a mutation.
  invalidationBehavior: "delayed",
  endpoints: () => ({}),
});
