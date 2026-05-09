import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInitialCountsStore } from "@/stores/initialCountsStore";
import { subscribeItemTable } from "@/services/realtime/itemRealtimeManager";

const DEBOUNCE_MS = 400;
const MAX_DEFER_MS = 1500;

/**
 * Subscribes to inserts/deletes on the `comments` table for a given item
 * and keeps the global initial counts store in sync, so feed counters
 * update instantly even when the comments section is closed.
 *
 * Bursts of events (e.g. many comments arriving at once) are coalesced:
 * a single authoritative HEAD COUNT query runs after a short debounce
 * window, with a hard ceiling so the counter never lags too long. The
 * optional `onChange` callback fires once per flushed batch so an open
 * comments panel can refetch the visible list a single time.
 *
 * Uses the shared per-item channel manager — multiple mounted components
 * for the same item share a single Supabase channel.
 */
export const useCommentCountRealtime = (
  itemId: string,
  onChange?: (event: "INSERT" | "DELETE") => void
) => {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!itemId) return;
    const numericId = parseInt(itemId);
    if (isNaN(numericId)) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let maxWaitTimer: ReturnType<typeof setTimeout> | null = null;
    let lastEvent: "INSERT" | "DELETE" = "INSERT";
    let inFlight = false;

    const flush = async () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      if (maxWaitTimer) {
        clearTimeout(maxWaitTimer);
        maxWaitTimer = null;
      }
      if (inFlight) return;
      inFlight = true;
      try {
        const { count, error } = await supabase
          .from("comments")
          .select("id", { count: "exact", head: true })
          .eq("item_id", numericId);
        if (!error && typeof count === "number") {
          useInitialCountsStore
            .getState()
            .setBulkCounts([{ itemId, commentsCount: count }]);
        }
      } catch {
        /* noop — best-effort sync */
      } finally {
        inFlight = false;
        onChangeRef.current?.(lastEvent);
      }
    };

    const schedule = (event: "INSERT" | "DELETE") => {
      lastEvent = event;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(flush, DEBOUNCE_MS);
      if (!maxWaitTimer) {
        maxWaitTimer = setTimeout(flush, MAX_DEFER_MS);
      }
    };

    const unsubscribe = subscribeItemTable(itemId, "comments", (payload) => {
      if (payload.eventType === "INSERT") schedule("INSERT");
      else if (payload.eventType === "DELETE") schedule("DELETE");
    });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (maxWaitTimer) clearTimeout(maxWaitTimer);
      unsubscribe();
    };
  }, [itemId]);
};
