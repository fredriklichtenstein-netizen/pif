import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInitialCountsStore } from "@/stores/initialCountsStore";
import { subscribeItemTable } from "@/services/realtime/itemRealtimeManager";

/**
 * Subscribes to inserts/deletes on the `likes` and `interests` tables
 * for a given item and keeps the global initial counts store in sync,
 * so feed counters update instantly without reopening the card.
 *
 * Uses authoritative HEAD COUNT queries instead of incrementing, to
 * avoid drift between the optimistic local state and what the database
 * actually has.
 *
 * Backed by the shared per-item channel manager so multiple mounted
 * components don't each spin up their own Supabase channel.
 */
export const useInteractionCountsRealtime = (itemId: string) => {
  useEffect(() => {
    if (!itemId) return;
    const numericId = parseInt(itemId);
    if (isNaN(numericId)) return;

    const setLikes = async () => {
      const { count, error } = await supabase
        .from("likes")
        .select("id", { count: "exact", head: true })
        .eq("item_id", numericId);
      if (!error && typeof count === "number") {
        useInitialCountsStore
          .getState()
          .setBulkCounts([{ itemId, likesCount: count }]);
      }
    };

    const setInterests = async () => {
      const { count, error } = await supabase
        .from("interests")
        .select("id", { count: "exact", head: true })
        .eq("item_id", numericId);
      if (!error && typeof count === "number") {
        useInitialCountsStore
          .getState()
          .setBulkCounts([{ itemId, interestsCount: count }]);
      }
    };

    const offLikes = subscribeItemTable(itemId, "likes", setLikes);
    const offInterests = subscribeItemTable(itemId, "interests", setInterests);

    return () => {
      offLikes();
      offInterests();
    };
  }, [itemId]);
};
