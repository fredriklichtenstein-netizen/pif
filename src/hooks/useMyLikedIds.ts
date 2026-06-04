import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { DEMO_MODE } from "@/config/demoMode";
import { useDemoInteractionsStore } from "@/stores/demoInteractionsStore";
import { useMyLikedStore } from "@/stores/myLikedStore";
import { isAuthRequestCircuitOpen, maybeRecoverFromAuthError } from "@/hooks/auth/sessionRecovery";

/**
 * Returns the set of item IDs that the current user has liked.
 * Initial fetch from the database on mount, plus a user-scoped realtime
 * subscription that keeps the global myLikedStore in sync so heart
 * buttons always reflect the correct state after a page reload.
 */
export const useMyLikedIds = () => {
  const { user } = useGlobalAuth();
  const userId = user?.id;
  const demoStore = useDemoInteractionsStore();
  const setMany = useMyLikedStore((s) => s.setMany);
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!userId) {
      setIds(new Set());
      setIsLoaded(true);
      return;
    }
    if (isAuthRequestCircuitOpen()) {
      setIsLoaded(true);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("likes")
        .select("item_id")
        .eq("user_id", userId);
      if (error) throw error;
      const next = new Set<string>((data ?? []).map((r: any) => String(r.item_id)));
      setIds(next);
      setMany(Array.from(next).map((id) => ({ itemId: id, value: true })));
      setIsLoaded(true);
    } catch (err) {
      maybeRecoverFromAuthError(err, "useMyLikedIds fetch");
      console.warn("[useMyLikedIds] fetch failed", err);
      setIsLoaded(true);
    }
  }, [userId, setMany]);

  useEffect(() => {
    if (!DEMO_MODE) return;
    // Demo store doesn't track per-item liked ids; leave empty.
    setIsLoaded(true);
  }, [demoStore]);

  useEffect(() => {
    if (DEMO_MODE) return;
    if (!userId) {
      setIds(new Set());
      setIsLoaded(true);
      return;
    }
    fetchAll();

    const channel = supabase
      .channel(`my-liked-ids-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "likes",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const row = payload.new ?? payload.old;
          const itemId = row?.item_id != null ? String(row.item_id) : null;
          if (!itemId) return;
          if (payload.eventType === "INSERT") {
            setIds((prev) => {
              if (prev.has(itemId)) return prev;
              const next = new Set(prev);
              next.add(itemId);
              return next;
            });
            setMany([{ itemId, value: true }]);
          } else if (payload.eventType === "DELETE") {
            setIds((prev) => {
              if (!prev.has(itemId)) return prev;
              const next = new Set(prev);
              next.delete(itemId);
              return next;
            });
            setMany([{ itemId, value: false }]);
          }
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
  }, [userId, fetchAll, setMany]);

  return { ids, isLoaded };
};
