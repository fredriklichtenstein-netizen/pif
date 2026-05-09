import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { maybeRecoverFromAuthError } from "@/hooks/auth/sessionRecovery";

/**
 * Shared per-item realtime subscription manager.
 *
 * Multiple hooks/components interested in the same `item_id` share a
 * single Supabase channel that fans out events to all registered
 * listeners. The channel is created lazily on first subscription and
 * torn down when the last listener unsubscribes.
 *
 * The channel self-heals: on CHANNEL_ERROR / TIMED_OUT / CLOSED we
 * re-subscribe with exponential backoff while there are still
 * listeners. When the tab returns from background or the network comes
 * back online we force an immediate refresh of every entry.
 */

export type ItemTable = "likes" | "interests" | "comments";
export type RealtimeStatus =
  | "PENDING"
  | "SUBSCRIBED"
  | "CHANNEL_ERROR"
  | "TIMED_OUT"
  | "CLOSED";
export type Listener = (payload: any) => void;
export type StatusListener = (status: RealtimeStatus) => void;

interface Entry {
  numericId: number;
  channel: RealtimeChannel | null;
  listeners: Record<ItemTable, Set<Listener>>;
  status: RealtimeStatus;
  statusListeners: Set<StatusListener>;
  refCount: number;
  retryCount: number;
  retryTimer: ReturnType<typeof setTimeout> | null;
}

const entries = new Map<number, Entry>();
const TABLES: ItemTable[] = ["likes", "interests", "comments"];
const BACKOFFS_MS = [1000, 2000, 5000, 10000, 15000];

const setStatus = (entry: Entry, status: RealtimeStatus) => {
  entry.status = status;
  entry.statusListeners.forEach((cb) => {
    try {
      cb(status);
    } catch {
      /* noop */
    }
  });
};

const buildChannel = (entry: Entry) => {
  const { numericId, listeners } = entry;
  const channel = supabase.channel(`item-shared-${numericId}-${Date.now()}`);

  TABLES.forEach((table) => {
    channel.on(
      "postgres_changes" as any,
      {
        event: "*",
        schema: "public",
        table,
        filter: `item_id=eq.${numericId}`,
      },
      (payload: any) => {
        listeners[table].forEach((cb) => {
          try {
            cb(payload);
          } catch (err) {
            console.warn(
              `[itemRealtimeManager] listener error (${table})`,
              err
            );
          }
        });
      }
    );
  });

  entry.channel = channel;
  setStatus(entry, "PENDING");

  channel.subscribe((status, err) => {
    const s = status as RealtimeStatus;
    setStatus(entry, s);
    if (s === "SUBSCRIBED") {
      entry.retryCount = 0;
      return;
    }
    if (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED") {
      // If the failure is due to a stale/invalid JWT (e.g. after a deploy),
      // trigger global session recovery instead of looping reconnects.
      if (maybeRecoverFromAuthError(err, `realtime channel ${s}`)) return;
      scheduleReconnect(entry);
    }
  });
};

const scheduleReconnect = (entry: Entry) => {
  if (entry.retryTimer) return;
  if (entry.refCount <= 0) return;
  const delay =
    BACKOFFS_MS[Math.min(entry.retryCount, BACKOFFS_MS.length - 1)];
  entry.retryTimer = setTimeout(() => {
    entry.retryTimer = null;
    entry.retryCount += 1;
    teardownChannel(entry);
    if (entry.refCount > 0) buildChannel(entry);
  }, delay);
};

const teardownChannel = (entry: Entry) => {
  if (entry.channel) {
    try {
      supabase.removeChannel(entry.channel);
    } catch {
      /* noop */
    }
    entry.channel = null;
  }
};

const ensureEntry = (numericId: number): Entry => {
  const existing = entries.get(numericId);
  if (existing) return existing;

  const entry: Entry = {
    numericId,
    channel: null,
    listeners: {
      likes: new Set(),
      interests: new Set(),
      comments: new Set(),
    },
    status: "PENDING",
    statusListeners: new Set(),
    refCount: 0,
    retryCount: 0,
    retryTimer: null,
  };

  entries.set(numericId, entry);
  buildChannel(entry);
  return entry;
};

const releaseEntry = (numericId: number, entry: Entry) => {
  entry.refCount = Math.max(0, entry.refCount - 1);
  if (entry.refCount > 0) return;
  const stillActive =
    entry.listeners.likes.size +
      entry.listeners.interests.size +
      entry.listeners.comments.size +
      entry.statusListeners.size >
    0;
  if (stillActive) return;
  if (entry.retryTimer) {
    clearTimeout(entry.retryTimer);
    entry.retryTimer = null;
  }
  teardownChannel(entry);
  entries.delete(numericId);
};

const parseId = (itemId: string | number): number | null => {
  const n = typeof itemId === "number" ? itemId : parseInt(itemId, 10);
  return isNaN(n) ? null : n;
};

export const subscribeItemTable = (
  itemId: string | number,
  table: ItemTable,
  listener: Listener
): (() => void) => {
  const numericId = parseId(itemId);
  if (numericId === null) return () => {};
  const entry = ensureEntry(numericId);
  entry.listeners[table].add(listener);
  entry.refCount += 1;
  return () => {
    const e = entries.get(numericId);
    if (!e) return;
    e.listeners[table].delete(listener);
    releaseEntry(numericId, e);
  };
};

export const subscribeItemStatus = (
  itemId: string | number,
  listener: StatusListener
): (() => void) => {
  const numericId = parseId(itemId);
  if (numericId === null) return () => {};
  const entry = ensureEntry(numericId);
  entry.statusListeners.add(listener);
  entry.refCount += 1;
  try {
    listener(entry.status);
  } catch {
    /* noop */
  }
  return () => {
    const e = entries.get(numericId);
    if (!e) return;
    e.statusListeners.delete(listener);
    releaseEntry(numericId, e);
  };
};

// Force immediate reconnect of every active entry — used when the tab
// becomes visible or the network comes back online.
const forceReconnectAll = () => {
  entries.forEach((entry) => {
    if (entry.retryTimer) {
      clearTimeout(entry.retryTimer);
      entry.retryTimer = null;
    }
    entry.retryCount = 0;
    teardownChannel(entry);
    if (entry.refCount > 0) buildChannel(entry);
  });
};

if (typeof window !== "undefined") {
  window.addEventListener("online", forceReconnectAll);
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") forceReconnectAll();
  });
}
