import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { DEMO_MODE } from "@/config/demoMode";
import { useMyCommentedStore } from "@/stores/myCommentedStore";
import { isAuthRequestCircuitOpen, maybeRecoverFromAuthError } from "@/hooks/auth/sessionRecovery";

/**
 * Returns the set of item IDs the current user has commented on.
 * Initial fetch from the database on mount, plus a user-scoped realtime
 * subscription that keeps the global myCommentedStore in sync — mirrors
 * useMyLikedIds/useMyInterestedIds so the comment button's active state
 * hydrates correctly on mount instead of only becoming known after the
 * full comment thread has been lazily fetched.
 *
 * DELETE is intentionally not handled here: a user can have multiple
 * comments in the same thread, and flipping back to "not commented" would
 * require re-checking for remaining rows. Once true, stays true — no risk
 * of a false negative, which is the failure mode that actually matters for
 * the button's active state.
 */
export const useMyCommentedIds = () => {
  const { user } = useGlobalAuth();
  const userId = user?.id;
  const setMany = useMyCommentedStore((s) => s.setMany);
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
        .from("comments")
        .select("item_id")
        .eq("user_id", userId);
      if (error) throw error;
      const next = new Set<string>((data ?? []).map((r: any) => String(r.item_id)));
      setIds(next);
      setMany(Array.from(next).map((id) => ({ itemId: id, value: true })));
      setIsLoaded(true);
    } catch (err) {
      maybeRecoverFromAuthError(err, "useMyCommentedIds fetch");
      console.warn("[useMyCommentedIds] fetch failed", err);
      setIsLoaded(true);
    }
  }, [userId, setMany]);

  useEffect(() => {
    if (DEMO_MODE) {
      setIsLoaded(true);
      return;
    }
    if (!userId) {
      setIds(new Set());
      setIsLoaded(true);
      return;
    }
    fetchAll();

    const channel = supabase
      .channel(`my-commented-ids-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const itemId = payload.new?.item_id != null ? String(payload.new.item_id) : null;
          if (!itemId) return;
          setIds((prev) => {
            if (prev.has(itemId)) return prev;
            const next = new Set(prev);
            next.add(itemId);
            return next;
          });
          setMany([{ itemId, value: true }]);
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
