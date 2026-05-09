import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAnnouncement } from "@/hooks/accessibility/useAnnouncement";
import { useRefreshSyncStore } from "@/stores/refreshSyncStore";

/**
 * Single shared refresh wrapper used by every "refresh" entry point
 * (feed pull-to-refresh, map pull-to-refresh, future toolbar buttons).
 *
 * Callers only supply the actual data fetch — this hook owns the
 * cross-view refresh state, the screen-reader announcements and the
 * try/finally bookkeeping so the begin/end pair can never get out of
 * sync.
 *
 * Safeguards:
 *   - A synchronous in-flight ref makes back-to-back invocations a
 *     no-op even within the same tick (before React re-renders with
 *     the new store value).
 *   - The store-level `isRefreshing` flag also blocks invocations from
 *     other components/views (e.g. a map control firing while the feed
 *     is mid-refresh).
 *   - The fetcher is read through a ref so callers don't need to
 *     memoize it perfectly — the returned `refresh` stays stable.
 */
export function useSharedRefresh(fetcher: () => Promise<unknown> | unknown) {
  const { t } = useTranslation();
  const { announce } = useAnnouncement();
  const isRefreshing = useRefreshSyncStore((s) => s.isRefreshing);
  const begin = useRefreshSyncStore((s) => s.begin);
  const end = useRefreshSyncStore((s) => s.end);

  const inFlightRef = useRef(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    // Synchronous guard: ignore overlapping calls instantly, before
    // any store update or re-render can flip `isRefreshing`.
    if (inFlightRef.current) return;
    // Cross-view guard: another component already kicked off a
    // refresh. Skip so we don't double-fetch or double-announce.
    if (useRefreshSyncStore.getState().isRefreshing) return;

    inFlightRef.current = true;
    announce(t("interactions.refreshing_feed"), "polite");
    begin();
    try {
      await fetcherRef.current();
      announce(t("interactions.feed_refreshed"), "polite");
    } finally {
      end();
      inFlightRef.current = false;
    }
  }, [announce, begin, end, t]);

  return { refresh, isRefreshing };
}

