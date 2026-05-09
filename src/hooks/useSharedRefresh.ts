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
export type RefreshSource = "feed" | "map";

const ANNOUNCE_KEYS: Record<RefreshSource, { start: string; end: string }> = {
  feed: { start: "interactions.refreshing_feed", end: "interactions.feed_refreshed" },
  map: { start: "interactions.refreshing_map", end: "interactions.map_refreshed" },
};

export function useSharedRefresh(
  fetcher: () => Promise<unknown> | unknown,
  source: RefreshSource = "feed",
) {
  const { t } = useTranslation();
  const { announce } = useAnnouncement();
  const isRefreshing = useRefreshSyncStore((s) => s.isRefreshing);
  const begin = useRefreshSyncStore((s) => s.begin);
  const end = useRefreshSyncStore((s) => s.end);

  const inFlightRef = useRef(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const sourceRef = useRef(source);
  sourceRef.current = source;
  // Throttle: ignore refresh taps that arrive within this window after
  // the previous refresh finished. Prevents rapid-fire button mashing
  // from queueing redundant fetches and showing flickering overlays.
  const THROTTLE_MS = 1500;
  const lastFinishedAtRef = useRef(0);

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return;
    if (useRefreshSyncStore.getState().isRefreshing) return;
    const sinceLast = Date.now() - lastFinishedAtRef.current;
    if (sinceLast < THROTTLE_MS) return;

    const keys = ANNOUNCE_KEYS[sourceRef.current];
    inFlightRef.current = true;
    announce(t(keys.start), "polite");
    begin();
    try {
      await fetcherRef.current();
      announce(t(keys.end), "polite");
    } finally {
      end();
      inFlightRef.current = false;
      lastFinishedAtRef.current = Date.now();
    }
  }, [announce, begin, end, t]);

  return { refresh, isRefreshing };
}

