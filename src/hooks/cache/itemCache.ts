/**
 * Stale-while-revalidate cache for the current user's own items
 * (posted pifs / wishes) and individual item records.
 *
 * Backed by localStorage so navigation, page reloads, and modal opens
 * render instantly with the last-known data and only refresh in the
 * background.
 */

const LIST_PREFIX = "my-items-cache:v1:";
const ITEM_PREFIX = "item-cache:v1:";

type Listener<T> = (value: T) => void;

const listListeners = new Map<string, Set<Listener<any[]>>>();
const itemListeners = new Map<string, Set<Listener<any>>>();

const listKey = (userId: string, scope: string) =>
  `${LIST_PREFIX}${userId}:${scope}`;
const itemKey = (id: string | number) => `${ITEM_PREFIX}${String(id)}`;

import { safeParseJSON, safeStringify } from "@/utils/safeStorage";

const safeRead = <T>(key: string): T | null =>
  safeParseJSON<T | null>(key, null);

const safeWrite = (key: string, value: unknown) => {
  safeStringify(key, value);
};


// ---------- Item-level cache ----------

export const readCachedItem = (id: string | number): any | null =>
  safeRead(itemKey(id));

export const writeCachedItem = (item: any | null | undefined) => {
  if (!item || (item.id === undefined || item.id === null)) return;
  safeWrite(itemKey(item.id), item);
  itemListeners.get(String(item.id))?.forEach((l) => l(item));
};

export const subscribeCachedItem = (
  id: string | number,
  listener: Listener<any>,
) => {
  const k = String(id);
  if (!itemListeners.has(k)) itemListeners.set(k, new Set());
  itemListeners.get(k)!.add(listener);
  return () => {
    itemListeners.get(k)?.delete(listener);
  };
};

export const removeCachedItem = (id: string | number) => {
  try {
    window.localStorage.removeItem(itemKey(id));
  } catch {
    /* ignore */
  }
};

// ---------- List cache (user's own items) ----------

export const readCachedList = (userId: string, scope: string): any[] | null =>
  safeRead(listKey(userId, scope));

export const writeCachedList = (
  userId: string,
  scope: string,
  items: any[],
) => {
  safeWrite(listKey(userId, scope), items);
  // Also seed the per-item cache so expanded views hydrate instantly.
  items.forEach((item) => {
    if (item && item.id !== undefined && item.id !== null) {
      safeWrite(itemKey(item.id), item);
    }
  });
  listListeners.get(listKey(userId, scope))?.forEach((l) => l(items));
};

export const subscribeCachedList = (
  userId: string,
  scope: string,
  listener: Listener<any[]>,
) => {
  const k = listKey(userId, scope);
  if (!listListeners.has(k)) listListeners.set(k, new Set());
  listListeners.get(k)!.add(listener);
  return () => {
    listListeners.get(k)?.delete(listener);
  };
};

export const clearMyItemsCache = (userId: string) => {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(`${LIST_PREFIX}${userId}:`)) toRemove.push(k);
    }
    toRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
};

/**
 * Wipe ALL cached lists and items, regardless of user. Use on sign-out or
 * account switching so a different user never sees the previous user's data.
 */
export const clearAllItemsCache = () => {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && (k.startsWith(LIST_PREFIX) || k.startsWith(ITEM_PREFIX))) {
        toRemove.push(k);
      }
    }
    toRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
  listListeners.forEach((set) => set.forEach((l) => l([])));
  itemListeners.forEach((set) => set.forEach((l) => l(null)));
};
