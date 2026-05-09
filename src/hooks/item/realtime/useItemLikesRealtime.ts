import { useEffect, useRef } from "react";
import { subscribeItemTable } from "@/services/realtime/itemRealtimeManager";

/**
 * Per-item realtime subscription on the `likes` table.
 * Mirrors useItemInterestRealtime: debounced refetch of the likers list
 * whenever any user likes / unlikes this item.
 */
export const useItemLikesRealtime = (
  itemId: string,
  onAnyChange?: () => void
) => {
  const cbRef = useRef(onAnyChange);
  cbRef.current = onAnyChange;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!itemId) return;
    const unsubscribe = subscribeItemTable(itemId, "likes", () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        cbRef.current?.();
      }, 300);
    });
    return () => {
      unsubscribe();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [itemId]);
};
