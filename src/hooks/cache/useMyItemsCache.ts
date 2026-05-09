import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  readCachedList,
  writeCachedList,
  subscribeCachedList,
} from "./itemCache";
import {
  isAuthInvalidError,
  isAuthRequestCircuitOpen,
  recoverFromCorruptedSession,
} from "@/hooks/auth/sessionRecovery";

interface Options {
  /** Cache scope key, e.g. 'active', 'archived', 'interested'. */
  scope: string;
  /** Build the supabase query for this user. */
  query: (userId: string) => Promise<{ data: any[] | null; error: any }>;
}

/**
 * Stale-while-revalidate hook for the current user's own item lists.
 * Returns cached data instantly and refreshes in the background.
 */
export function useMyItemsCache(userId: string | null | undefined, opts: Options) {
  const { scope, query } = opts;
  const queryRef = useRef(query);
  queryRef.current = query;

  const [items, setItems] = useState<any[]>(() =>
    userId ? readCachedList(userId, scope) ?? [] : [],
  );
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Keep state in sync with cache writes from other components.
  useEffect(() => {
    if (!userId) return;
    return subscribeCachedList(userId, scope, (next) => setItems(next));
  }, [userId, scope]);

  // Hydrate from cache when user changes.
  useEffect(() => {
    if (!userId) {
      setItems([]);
      return;
    }
    const cached = readCachedList(userId, scope);
    if (cached) setItems(cached);
  }, [userId, scope]);

  const refresh = async () => {
    if (!userId || isAuthRequestCircuitOpen()) return;
    setIsRevalidating(true);
    setError(null);
    try {
      const { data, error: err } = await queryRef.current(userId);
      if (err) {
        if (isAuthInvalidError(err)) {
          await recoverFromCorruptedSession(`useMyItemsCache(${scope}): ${err.message}`);
          return;
        }
        throw err;
      }
      const next = data ?? [];
      writeCachedList(userId, scope, next);
      // subscribeCachedList listener updates state.
    } catch (e: any) {
      console.error(`useMyItemsCache(${scope}) failed:`, e);
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsRevalidating(false);
    }
  };

  // Background revalidation on mount / userId change.
  useEffect(() => {
    if (!userId) return;
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, scope]);

  // Listen for realtime item changes for this user.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`my-items-${userId}-${scope}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, scope]);

  return {
    items,
    isRevalidating,
    /** True only when we have nothing cached AND a fetch is in flight. */
    isLoading: items.length === 0 && isRevalidating,
    error,
    refresh,
    setItems: (next: any[]) => {
      if (!userId) return;
      writeCachedList(userId, scope, next);
    },
  };
}
