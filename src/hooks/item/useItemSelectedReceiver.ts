import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Lightweight per-item lookup of which user has been selected as the
 * receiver (pif) or fulfiller(s) (wish).
 *
 * Returns the first/only selected user id (sufficient for pifs which
 * allow only one selection). Wishes allow multiple — for those we
 * only care whether the *current user* is among the selected set, so
 * the caller passes `currentUserId` and we expose `isCurrentSelected`.
 */
export function useItemSelectedReceiver(
  itemId: string | number | undefined,
  currentUserId?: string | null,
) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!itemId) return;
    const numericId =
      typeof itemId === "number" ? itemId : parseInt(String(itemId), 10);
    if (!numericId || isNaN(numericId)) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("interests")
        .select("user_id, status")
        .eq("item_id", numericId)
        .eq("status", "selected");
      if (error) throw error;
      setSelectedUserIds((data || []).map((r: any) => r.user_id).filter(Boolean));
    } catch (err) {
      // Silent — UI falls back to default state.
      console.warn("[useItemSelectedReceiver] fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const hasSelection = selectedUserIds.length > 0;
  const isCurrentSelected =
    !!currentUserId && selectedUserIds.includes(currentUserId);
  const selectedUserId = selectedUserIds[0] ?? null;

  return {
    selectedUserId,
    selectedUserIds,
    hasSelection,
    isCurrentSelected,
    loading,
    refetch,
  };
}
