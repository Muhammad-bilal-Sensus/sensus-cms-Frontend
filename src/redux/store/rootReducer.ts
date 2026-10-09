import { combineReducers } from "@reduxjs/toolkit";
import { cmsApi } from "../api/baseApi";

export const rootReducer = combineReducers({
  [cmsApi.reducerPath]: cmsApi.reducer,
});
