import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  isAuthInvalidError,
  isNetworkError,
  recoverFromCorruptedSession,
  isAuthRequestCircuitOpen,
} from "@/hooks/auth/sessionRecovery";

/**
 * Stale-while-revalidate profile cache.
 *
 * - Synchronously hydrates from localStorage so UI (avatar, profile page)
 *   renders instantly on every navigation/reload.
 * - Kicks off a background refetch and updates state + cache when fresh
 *   data arrives.
 * - In-memory cache shared across hook instances avoids duplicate fetches
 *   across components mounting in the same render pass.
 */

const STORAGE_PREFIX = "profile-cache:v1:";
const memoryCache = new Map<string, any>();
const inFlight = new Map<string, Promise<any | null>>();
const listeners = new Map<string, Set<(data: any) => void>>();

const storageKey = (userId: string) => `${STORAGE_PREFIX}${userId}`;

const notify = (userId: string, data: any) => {
  const subs = listeners.get(userId);
  if (subs) subs.forEach((cb) => cb(data));
};

const subscribe = (userId: string, cb: (data: any) => void) => {
  let subs = listeners.get(userId);
  if (!subs) {
    subs = new Set();
    listeners.set(userId, subs);
  }
  subs.add(cb);
  return () => {
    subs!.delete(cb);
    if (subs!.size === 0) listeners.delete(userId);
  };
};

const readCache = (userId: string): any | null => {
  if (memoryCache.has(userId)) return memoryCache.get(userId);
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    memoryCache.set(userId, parsed);
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = (userId: string, data: any) => {
  memoryCache.set(userId, data);
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(data));
  } catch {
    /* quota — ignore */
  }
  notify(userId, data);
};

/**
 * Optimistically merge a partial update into the cached profile and notify
 * all subscribers immediately. Use this right after firing a profile update
 * mutation so the UI reflects the change without waiting for the round-trip.
 */
export const updateCachedProfile = (
  userId: string,
  patch: Record<string, any>,
) => {
  if (!userId) return null;
  const current = readCache(userId) ?? {};
  const next = { ...current, ...patch, updated_at: new Date().toISOString() };
  writeCache(userId, next);
  return next;
};

export const clearCachedProfile = (userId: string) => {
  memoryCache.delete(userId);
  try {
    window.localStorage.removeItem(storageKey(userId));
  } catch {
    /* ignore */
  }
  notify(userId, null);
};

const fetchProfileOnce = (userId: string): Promise<any | null> => {
  const existing = inFlight.get(userId);
  if (existing) return existing;

  const promise = (async () => {
    if (isAuthRequestCircuitOpen()) return null;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("useCachedProfile: fetch error", error);
        if (isAuthInvalidError(error)) {
          await recoverFromCorruptedSession(`useCachedProfile: ${error.message}`);
        }
        return null;
      }
      if (data) writeCache(userId, data);
      return data;
    } catch (err) {
      if (!isNetworkError(err) && isAuthInvalidError(err)) {
        await recoverFromCorruptedSession(
          `useCachedProfile exception: ${err instanceof Error ? err.message : String(err)}`,
        );
      } else {
        console.warn("useCachedProfile: transient fetch failure", err);
      }
      return null;
    } finally {
      inFlight.delete(userId);
    }
  })();

  inFlight.set(userId, promise);
  return promise;
};

interface Options {
  /** Re-fetch on mount even if a fresh value is in memory. Default: true */
  revalidate?: boolean;
}

export const useCachedProfile = (
  userId: string | null | undefined,
  options: Options = {},
) => {
  const { revalidate = true } = options;
  const [profile, setProfile] = useState<any | null>(() =>
    userId ? readCache(userId) : null,
  );
  const [isRevalidating, setIsRevalidating] = useState(false);
  const lastUserId = useRef<string | null | undefined>(userId);

  // Reset state when user changes
  useEffect(() => {
    if (lastUserId.current !== userId) {
      lastUserId.current = userId;
      setProfile(userId ? readCache(userId) : null);
    }
  }, [userId]);

  // Background revalidation
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    if (!revalidate && readCache(userId)) return;

    setIsRevalidating(true);
    fetchProfileOnce(userId).then((fresh) => {
      if (cancelled) return;
      if (fresh) setProfile(fresh);
      setIsRevalidating(false);
    });

    return () => {
      cancelled = true;
    };
  }, [userId, revalidate]);

  // Listen for realtime profile updates
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`profile-cache-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const next = payload.new as any;
          if (next) {
            writeCache(userId, next);
            setProfile(next);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const refresh = async () => {
    if (!userId) return null;
    setIsRevalidating(true);
    const fresh = await fetchProfileOnce(userId);
    if (fresh) setProfile(fresh);
    setIsRevalidating(false);
    return fresh;
  };

  return {
    profile,
    isRevalidating,
    /** True only when there's no cached data AND a fetch is in flight. */
    isLoading: !profile && isRevalidating,
    refresh,
  };
};
