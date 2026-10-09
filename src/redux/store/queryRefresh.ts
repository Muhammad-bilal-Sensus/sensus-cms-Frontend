import { cmsApi } from "../api/baseApi";
import { useCallback } from "react";
import { QueryStatus } from "@reduxjs/toolkit/query";
import type { store as appStore } from "./store";
import { useAppStore } from "./hooks";

// Delayed invalidation may schedule a fresh read when an older read finishes.
// Wait until that batch settles before closing a dialog or leaving the editor.
export function waitForQueryRefresh(store: Pick<typeof appStore, "getState" | "subscribe">): Promise<void> {
  return new Promise((resolve) => {
    let queued = false;
    const check = () => {
      if (queued) return;
      queued = true;
      // Middleware schedules refetches after reducer subscribers are notified.
      queueMicrotask(() => {
        queued = false;
        const state = store.getState()[cmsApi.reducerPath];
        const pending = [...Object.values(state.queries), ...Object.values(state.mutations)]
          .some((request) => request?.status === QueryStatus.pending);
        if (!pending) {
          unsubscribe();
          resolve();
        }
      });
    };
    const unsubscribe = store.subscribe(check);
    check();
  });
}

export function useWaitForQueryRefresh() {
  const store = useAppStore();
  return useCallback(() => waitForQueryRefresh(store), [store]);
}
