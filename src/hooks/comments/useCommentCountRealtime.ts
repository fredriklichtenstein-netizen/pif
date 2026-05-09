import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInitialCountsStore } from "@/stores/initialCountsStore";

/**
 * Subscribes to inserts/deletes on the `comments` table for a given item
 * and keeps the global initial counts store in sync, so feed counters
 * update instantly even when the comments section is closed.
 *
 * Optional `onChange` callback fires after the store is updated so callers
 * (e.g. an open comments panel) can refetch the visible list.
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

    const bump = (delta: number) => {
      const key = String(itemId);
      const current =
        useInitialCountsStore.getState().counts[key]?.commentsCount ?? 0;
      useInitialCountsStore.getState().setBulkCounts([
        { itemId, commentsCount: Math.max(0, current + delta) },
      ]);
    };

    const channel = supabase
      .channel(`comment-count-${numericId}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `item_id=eq.${numericId}`,
        },
        () => {
          bump(1);
          onChangeRef.current?.("INSERT");
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "comments",
          filter: `item_id=eq.${numericId}`,
        },
        () => {
          bump(-1);
          onChangeRef.current?.("DELETE");
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {
        /* noop */
      }
    };
  }, [itemId]);
};
