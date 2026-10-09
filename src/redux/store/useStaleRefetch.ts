import { useEffect, useRef } from "react";

type QueryRefetchState = {
  fulfilledTimeStamp?: number;
  isFetching: boolean;
  isUninitialized: boolean;
  refetch: () => unknown;
};

type StaleRefetchOptions = { onFocus?: boolean };

// RTK's focus/reconnect flags always refetch. Reference queries previously
// refreshed on these events only after their five-minute freshness period.
export function useStaleRefetch(
  query: QueryRefetchState,
  freshSeconds: number,
  { onFocus = true }: StaleRefetchOptions = {},
) {
  const latest = useRef(query);
  useEffect(() => { latest.current = query; }, [query]);

  useEffect(() => {
    const refetchIfStale = () => {
      const current = latest.current;
      if (current.isUninitialized || current.isFetching) return;
      if (current.fulfilledTimeStamp === undefined || Date.now() - current.fulfilledTimeStamp >= freshSeconds * 1000) {
        current.refetch();
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") refetchIfStale();
    };
    if (onFocus) {
      window.addEventListener("focus", refetchIfStale);
      document.addEventListener("visibilitychange", onVisible);
    }
    window.addEventListener("online", refetchIfStale);
    return () => {
      window.removeEventListener("focus", refetchIfStale);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", refetchIfStale);
    };
  }, [freshSeconds, onFocus]);
}
