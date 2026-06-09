// Persistent client-side cache for feed/map results.
//
// Backed by sessionStorage (survives in-app navigation and full-page
// refreshes within the same tab; cleared on tab close so we never serve
// truly stale data across sessions). Falls back to an in-memory Map when
// storage isn't available (SSR, private mode, quota errors).

import type { Post } from "@/types/post";

const STORAGE_PREFIX = "pif:cache:";
const LEGACY_KEY = "posts_cache"; // old single-bucket cache, kept for compat
const DEFAULT_TTL = 60 * 1000; // 60s — short enough to feel fresh, long enough to dedupe refresh+route-switch

interface Entry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const memoryFallback = new Map<string, Entry<unknown>>();

const safeStorage = (): Storage | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const storageKey = (key: string) => `${STORAGE_PREFIX}${key}`;

export function setCache<T>(key: string, data: T, ttl = DEFAULT_TTL): void {
  const entry: Entry<T> = { data, timestamp: Date.now(), ttl };
  const storage = safeStorage();
  if (storage) {
    try {
      storage.setItem(storageKey(key), JSON.stringify(entry));
      return;
    } catch {
      // fall through to memory fallback (quota exceeded, etc.)
    }
  }
  memoryFallback.set(key, entry);
}

export function getCache<T>(key: string): T | null {
  return readCache<T>(key)?.data ?? null;
}

export function readCache<T>(key: string): { data: T; isStale: boolean } | null {
  const raw = readEntry<T>(key);
  if (!raw) return null;
  const isStale = Date.now() - raw.timestamp > raw.ttl;
  return { data: raw.data, isStale };
}

function readEntry<T>(key: string): Entry<T> | null {
  const storage = safeStorage();
  if (storage) {
    try {
      const raw = storage.getItem(storageKey(key));
      if (raw) {
        const trimmed = raw.trim();
        if (trimmed && (trimmed[0] === "{" || trimmed[0] === "[")) {
          try {
            return JSON.parse(trimmed) as Entry<T>;
          } catch {
            try { storage.removeItem(storageKey(key)); } catch { /* ignore */ }
          }
        } else {
          try { storage.removeItem(storageKey(key)); } catch { /* ignore */ }
        }
      }
    } catch {
      // ignore storage access errors
    }
  }
  return (memoryFallback.get(key) as Entry<T>) ?? null;
}


export function deleteCache(key: string): void {
  const storage = safeStorage();
  if (storage) {
    try {
      storage.removeItem(storageKey(key));
    } catch {
      // ignore
    }
  }
  memoryFallback.delete(key);
}

export function clearCacheByPrefix(prefix: string): void {
  const storage = safeStorage();
  if (storage) {
    try {
      const fullPrefix = storageKey(prefix);
      const toRemove: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k && k.startsWith(fullPrefix)) toRemove.push(k);
      }
      toRemove.forEach((k) => storage.removeItem(k));
    } catch {
      // ignore
    }
  }
  for (const k of Array.from(memoryFallback.keys())) {
    if (k.startsWith(prefix)) memoryFallback.delete(k);
  }
}

// ---------- Backwards compatible helpers ----------

export const getPostsFromCache = (): Post[] | null => {
  // Try the new typed cache only. The legacy localStorage bucket has held
  // malformed PostGIS strings in older builds and can throw `Unexpected token (`
  // when parsed, so never read it back into the feed path.
  const fresh = getCache<Post[]>("posts:legacy");
  if (fresh) return fresh;
  return null;
};

export const cachePostsData = (data: Post[]) => {
  setCache("posts:legacy", data, 5 * 60 * 1000);
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore storage errors
  }
};

// Shared keys so feed and map can read each other's writes.
export const FEED_CACHE_KEYS = {
  optimizedPage: (limit: number, offset: number) =>
    `posts:optimized:${limit}:${offset}`,
  fullList: (includeArchived: boolean) =>
    `posts:full:${includeArchived ? "all" : "active"}`,
};
