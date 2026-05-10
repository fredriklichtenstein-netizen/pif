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

    const setLikes = async () => {
      if (isAuthRequestCircuitOpen()) return;
      const { count, error } = await supabase
        .from("likes")
        .select("id", { count: "exact", head: true })
        .eq("item_id", numericId);
      if (error) {
        maybeRecoverFromAuthError(error, "useInteractionCountsRealtime likes");
        return;
      }
      if (typeof count === "number") {
        useInitialCountsStore
          .getState()
          .setBulkCounts([{ itemId, likesCount: count }]);
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

    const offLikes = subscribeItemTable(itemId, "likes", setLikes);
    const offInterests = subscribeItemTable(itemId, "interests", setInterests);

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
    };
  }, [itemId, authInitialized]);
};
