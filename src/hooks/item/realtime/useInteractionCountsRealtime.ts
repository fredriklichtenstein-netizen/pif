import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInitialCountsStore } from "@/stores/initialCountsStore";
import {
  subscribeItemTable,
  subscribeItemStatus,
} from "@/services/realtime/itemRealtimeManager";
import { isAuthRequestCircuitOpen, maybeRecoverFromAuthError } from "@/hooks/auth/sessionRecovery";
import { useAuthStore } from "@/hooks/auth/authStore";

const POLL_INTERVAL_MS = 15000;

/**
 * Subscribes to inserts/deletes on the `likes` and `interests` tables
 * for a given item and keeps the global initial counts store in sync.
 *
 * When the underlying realtime channel is unhealthy (CHANNEL_ERROR /
 * TIMED_OUT / CLOSED / PENDING) we transparently poll the counts every
 * 15s so the UI never lags more than that even if realtime is broken.
 */
export const useInteractionCountsRealtime = (itemId: string) => {
  const authInitialized = useAuthStore((s) => s.initialized);
  useEffect(() => {
    if (!authInitialized) return;
    if (!itemId) return;
    const numericId = parseInt(itemId);
    if (isNaN(numericId)) return;

    // Saves are private (RLS: own row only), so a HEAD count on `likes`
    // would only ever see the viewer's own save. The counts RPC is
    // SECURITY DEFINER and returns the real total.
    const setLikes = async () => {
      if (isAuthRequestCircuitOpen()) return;
      const { data, error } = await (supabase.rpc as any)("get_bulk_interaction_counts", {
        p_item_ids: [numericId],
      });
      if (error) {
        maybeRecoverFromAuthError(error, "useInteractionCountsRealtime likes");
        return;
      }
      const row = Array.isArray(data) ? data[0] : null;
      if (row) {
        useInitialCountsStore
          .getState()
          .setBulkCounts([{ itemId, likesCount: Number(row.likes_count ?? 0) }]);
      }
    };

    const setInterests = async () => {
      if (isAuthRequestCircuitOpen()) return;
      const { count, error } = await supabase
        .from("interests")
        .select("id", { count: "exact", head: true })
        .eq("item_id", numericId);
      if (error) {
        maybeRecoverFromAuthError(
          error,
          "useInteractionCountsRealtime interests",
        );
        return;
      }
      if (typeof count === "number") {
        useInitialCountsStore
          .getState()
          .setBulkCounts([{ itemId, interestsCount: count }]);
      }
    };

    // Debounce both authoritative HEAD COUNT refreshes so a burst of
    // INSERT/DELETE realtime echoes (e.g. our own optimistic write +
    // server echo, or rapid toggle) collapses into a single recount
    // that always writes the absolute DB value back to the store.
    let likesTimer: ReturnType<typeof setTimeout> | null = null;
    let interestsTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedSetLikes = () => {
      if (likesTimer) clearTimeout(likesTimer);
      likesTimer = setTimeout(() => {
        likesTimer = null;
        setLikes();
      }, 250);
    };
    const debouncedSetInterests = () => {
      if (interestsTimer) clearTimeout(interestsTimer);
      interestsTimer = setTimeout(() => {
        interestsTimer = null;
        setInterests();
      }, 250);
    };

    const offLikes = subscribeItemTable(itemId, "likes", debouncedSetLikes);
    const offInterests = subscribeItemTable(itemId, "interests", debouncedSetInterests);

    let pollTimer: ReturnType<typeof setInterval> | null = null;
    const stopPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };
    const startPolling = () => {
      if (isAuthRequestCircuitOpen()) return;
      if (pollTimer) return;
      pollTimer = setInterval(() => {
        setLikes();
        setInterests();
      }, POLL_INTERVAL_MS);
    };

    const offStatus = subscribeItemStatus(itemId, (status) => {
      if (status === "SUBSCRIBED") stopPolling();
      else startPolling();
    });

    return () => {
      offLikes();
      offInterests();
      offStatus();
      stopPolling();
      if (likesTimer) clearTimeout(likesTimer);
      if (interestsTimer) clearTimeout(interestsTimer);
    };
  }, [itemId, authInitialized]);
};
