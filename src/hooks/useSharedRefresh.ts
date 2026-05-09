import { useCallback } from "react";
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
 */
export function useSharedRefresh(fetcher: () => Promise<unknown> | unknown) {
  const { t } = useTranslation();
  const { announce } = useAnnouncement();
  const isRefreshing = useRefreshSyncStore((s) => s.isRefreshing);
  const begin = useRefreshSyncStore((s) => s.begin);
  const end = useRefreshSyncStore((s) => s.end);

  const refresh = useCallback(async () => {
    announce(t("interactions.refreshing_feed"), "polite");
    begin();
    try {
      await fetcher();
      announce(t("interactions.feed_refreshed"), "polite");
    } finally {
      end();
    }
  }, [announce, begin, end, fetcher, t]);

  return { refresh, isRefreshing };
}
