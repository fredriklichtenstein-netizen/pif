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

/**
 * Time after which a cached profile is considered "stale" and should be
 * revalidated against the backend on the next mount/render. Until then the
 * cached value is served without any network request.
 */
const STALE_TTL_MS = 5 * 60 * 1000; // 5 minutes
/**
 * Hard expiry — older than this and the cache is treated as missing, so the
 * UI shows a loader instead of potentially long-stale data.
 */
const HARD_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

type CacheEntry = { data: any; cachedAt: number };

const memoryCache = new Map<string, CacheEntry>();
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

const readEntry = (userId: string): CacheEntry | null => {
  const mem = memoryCache.get(userId);
  if (mem) return mem;
  const parsed = safeParseJSON<any>(storageKey(userId), null);
  if (!parsed) return null;
  const entry: CacheEntry =
    parsed && typeof parsed === "object" && "data" in parsed && "cachedAt" in parsed
      ? (parsed as CacheEntry)
      : { data: parsed, cachedAt: Date.now() };
  memoryCache.set(userId, entry);
  return entry;
};


const readCache = (userId: string): any | null => {
  const entry = readEntry(userId);
  if (!entry) return null;
  // Hard expiry — drop the entry entirely.
  if (Date.now() - entry.cachedAt > HARD_TTL_MS) {
    memoryCache.delete(userId);
    try {
      window.localStorage.removeItem(storageKey(userId));
    } catch {
      /* ignore */
    }
    return null;
  }
  return entry.data;
};

const isStale = (userId: string): boolean => {
  const entry = readEntry(userId);
  if (!entry) return true;
  return Date.now() - entry.cachedAt > STALE_TTL_MS;
};

const writeCache = (userId: string, data: any) => {
  const entry: CacheEntry = { data, cachedAt: Date.now() };
  memoryCache.set(userId, entry);
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(entry));
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

/**
 * Wipe every cached profile (all users). Use on sign-out or when switching
 * accounts so a new user never sees the previous user's profile data.
 */
export const clearAllCachedProfiles = () => {
  const ids = Array.from(memoryCache.keys());
  memoryCache.clear();
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) toRemove.push(k);
      const id = k?.slice(STORAGE_PREFIX.length);
      if (id) ids.push(id);
    }
    toRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
  // Notify every known subscriber so live UI clears immediately.
  new Set(ids).forEach((id) => notify(id, null));
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
  /**
   * Re-fetch on mount even if a fresh (non-stale) value is in cache.
   * Default: true. When false, the hook only revalidates if the cached
   * entry has exceeded `STALE_TTL_MS`.
   */
  revalidate?: boolean;
  /** Override the default stale TTL (ms). */
  staleTtlMs?: number;
}

export const useCachedProfile = (
  userId: string | null | undefined,
  options: Options = {},
) => {
  const { revalidate = true, staleTtlMs } = options;
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

  // Background revalidation on mount/userId change.
  // - revalidate=true (default): always refetch.
  // - revalidate=false: only refetch when the cache is stale (older than TTL).
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const cached = readCache(userId);
    const stale = staleTtlMs != null
      ? !cached || (Date.now() - (readEntry(userId)?.cachedAt ?? 0) > staleTtlMs)
      : isStale(userId);

    if (!revalidate && cached && !stale) return;

    setIsRevalidating(true);
    fetchProfileOnce(userId).then((fresh) => {
      if (cancelled) return;
      if (fresh) setProfile(fresh);
      setIsRevalidating(false);
    });

    return () => {
      cancelled = true;
    };
  }, [userId, revalidate, staleTtlMs]);

  // Periodic + visibility-driven TTL revalidation: while the hook is
  // mounted, check every minute whether the cache has gone stale and
  // refresh silently in the background. Also refresh when the tab
  // becomes visible again after being hidden.
  useEffect(() => {
    if (!userId) return;

    const maybeRevalidate = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      const ttl = staleTtlMs ?? STALE_TTL_MS;
      const entry = readEntry(userId);
      if (entry && Date.now() - entry.cachedAt <= ttl) return;
      fetchProfileOnce(userId).then((fresh) => {
        if (fresh) setProfile(fresh);
      });
    };

    const interval = window.setInterval(maybeRevalidate, 60 * 1000);
    const onVisible = () => {
      if (!document.hidden) maybeRevalidate();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId, staleTtlMs]);

  // Listen for realtime profile updates. Merge changed fields into the
  // existing cached profile instead of replacing the whole object so the
  // UI doesn't flicker (avatar reload, layout reflow) when only one field
  // — e.g. `last_seen_at` or `phone` — actually changed.
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
          const next = payload.new as Record<string, any> | null;
          if (!next) return;

          const current = (readCache(userId) ?? {}) as Record<string, any>;

          // Compute a minimal diff of fields whose values actually changed.
          const diff: Record<string, any> = {};
          for (const key of Object.keys(next)) {
            // Ignore noisy timestamp-only updates that don't reflect a
            // user-visible change.
            if (key === "updated_at") continue;
            if (next[key] !== current[key]) diff[key] = next[key];
          }

          if (Object.keys(diff).length === 0) {
            // Nothing meaningful changed — keep current object reference so
            // React subtree doesn't re-render and images don't reload.
            return;
          }

          const merged = { ...current, ...diff, updated_at: next.updated_at };
          writeCache(userId, merged);
          setProfile(merged);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Subscribe to optimistic cache writes from anywhere in the app
  useEffect(() => {
    if (!userId) return;
    return subscribe(userId, (data) => setProfile(data));
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
