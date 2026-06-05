import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { DEMO_MODE } from "@/config/demoMode";
import { useDemoInteractionsStore } from "@/stores/demoInteractionsStore";
import { useMyInterestStore } from "@/stores/myInterestStore";
import { isAuthRequestCircuitOpen, maybeRecoverFromAuthError } from "@/hooks/auth/sessionRecovery";

/**
 * Returns the set of item IDs that the current user is interested in.
 *
 * Sources:
 *   - Demo mode  → `demoInteractionsStore.interestedItems`
 *   - Real auth  → one fetch on mount + a user-scoped realtime
 *                  subscription on the `interests` table.
 *
 * Mirrors every entry into `useMyInterestStore` so per-item buttons
 * already wired to that store stay in sync without any extra work.
 */
export const useMyInterestedIds = () => {
  const { user } = useGlobalAuth();
  const userId = user?.id;
  const demoIds = useDemoInteractionsStore((s) => s.interestedItems);
  const setMany = useMyInterestStore((s) => s.setMany);
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchAll = useCallback(async () => {
    setIsLoaded(false);
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
        .from("interests")
        .select("item_id")
        .eq("user_id", userId);
      if (error) throw error;
      const next = new Set<string>(
        (data ?? []).map((r: any) => String(r.item_id))
      );
      setIds(next);
      setMany(Array.from(next).map((id) => ({ itemId: id, value: true })));
      setIsLoaded(true);
    } catch (err) {
      maybeRecoverFromAuthError(err, "useMyInterestedIds fetch");
      console.warn("[useMyInterestedIds] fetch failed", err);
      setIsLoaded(true);
    }
  }, [userId, setMany]);

  // Demo mode: derive directly from the demo store.
  useEffect(() => {
    if (!DEMO_MODE) return;
    setIds(new Set(demoIds.map(String)));
    setIsLoaded(true);
  }, [demoIds]);

  // Real auth: initial fetch + realtime user-scoped subscription.
  useEffect(() => {
    if (DEMO_MODE) return;
    if (!userId) {
      setIds(new Set());
      setIsLoaded(true);
      return;
    }
    fetchAll();

    const channel = supabase
      .channel(`my-interest-ids-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "interests",
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
