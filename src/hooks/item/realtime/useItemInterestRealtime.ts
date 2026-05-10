import { useEffect, useRef } from "react";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useAuthStore } from "@/hooks/auth/authStore";
import { useMyInterestStore } from "@/stores/myInterestStore";
import { subscribeItemTable } from "@/services/realtime/itemRealtimeManager";

/**
 * Per-item realtime subscription on the `interests` table:
 *  - keeps the global "is the current user interested?" state in sync,
 *  - fires the supplied debounced callback so consumers can refetch
 *    `interestedUsers` when anyone shows / removes interest.
 *
 * Counts are handled separately by useInteractionCountsRealtime.
 *
 * Uses the shared per-item channel manager — multiple components
 * subscribing to the same item share one Supabase channel.
 */
export const useItemInterestRealtime = (
  itemId: string,
  onAnyChange?: () => void
) => {
  const { user } = useGlobalAuth();
  const userId = user?.id;
  const authInitialized = useAuthStore((s) => s.initialized);
  const cbRef = useRef(onAnyChange);
  cbRef.current = onAnyChange;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setMine = useMyInterestStore((s) => s.set);

  useEffect(() => {
    if (!authInitialized) return;
    if (!itemId) return;

    const unsubscribe = subscribeItemTable(itemId, "interests", (payload) => {
      const row = payload.new ?? payload.old;
      if (row && userId && row.user_id === userId) {
        if (payload.eventType === "INSERT") setMine(itemId, true);
        else if (payload.eventType === "DELETE") setMine(itemId, false);
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        cbRef.current?.();
      }, 300);
    });

    return () => {
      unsubscribe();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [itemId, userId, setMine, authInitialized]);
};
