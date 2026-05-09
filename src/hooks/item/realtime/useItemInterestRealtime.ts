import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useMyInterestStore } from "@/stores/myInterestStore";

/**
 * Per-item realtime subscription on the `interests` table:
 *  - keeps the global "is the current user interested?" state in sync,
 *  - fires the supplied debounced callback so consumers can refetch
 *    `interestedUsers` when anyone shows / removes interest.
 *
 * Counts are handled separately by useInteractionCountsRealtime.
 */
export const useItemInterestRealtime = (
  itemId: string,
  onAnyChange?: () => void
) => {
  const { user } = useGlobalAuth();
  const userId = user?.id;
  const cbRef = useRef(onAnyChange);
  cbRef.current = onAnyChange;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setMine = useMyInterestStore((s) => s.set);

  useEffect(() => {
    if (!itemId) return;
    const numericId = parseInt(itemId, 10);
    if (isNaN(numericId)) return;

    const channel = supabase
      .channel(`item-interest-${numericId}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "interests",
          filter: `item_id=eq.${numericId}`,
        },
        (payload: any) => {
          const row = payload.new ?? payload.old;
          if (row && userId && row.user_id === userId) {
            if (payload.eventType === "INSERT") setMine(itemId, true);
            else if (payload.eventType === "DELETE") setMine(itemId, false);
          }
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            cbRef.current?.();
          }, 300);
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {
        /* noop */
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [itemId, userId, setMine]);
};
