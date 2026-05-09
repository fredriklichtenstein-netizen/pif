import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Shared per-item realtime subscription manager.
 *
 * Goal: avoid creating one Supabase channel per mounted component.
 * Multiple hooks/components interested in the same `item_id` share a
 * single channel that fans out events to all registered listeners.
 *
 * Tables covered: `likes`, `interests`, `comments` (all filtered by
 * `item_id`). The channel is created lazily on first subscription and
 * torn down when the last listener unsubscribes.
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
  channel: RealtimeChannel;
  listeners: Record<ItemTable, Set<Listener>>;
  status: RealtimeStatus;
  statusListeners: Set<StatusListener>;
  refCount: number;
}

const entries = new Map<number, Entry>();
const TABLES: ItemTable[] = ["likes", "interests", "comments"];

const ensureEntry = (numericId: number): Entry => {
  const existing = entries.get(numericId);
  if (existing) return existing;

  const listeners: Entry["listeners"] = {
    likes: new Set(),
    interests: new Set(),
    comments: new Set(),
  };

  const channel = supabase.channel(`item-shared-${numericId}`);

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

  const entry: Entry = {
    channel,
    listeners,
    status: "PENDING",
    statusListeners: new Set(),
    refCount: 0,
  };

  channel.subscribe((status) => {
    entry.status = status as RealtimeStatus;
    entry.statusListeners.forEach((cb) => {
      try {
        cb(entry.status);
      } catch {
        /* noop */
      }
    });
  });

  entries.set(numericId, entry);
  return entry;
};

const releaseEntry = (numericId: number, entry: Entry) => {
  entry.refCount = Math.max(0, entry.refCount - 1);
  if (entry.refCount > 0) return;
  // No more listeners across any table or status — tear down the channel.
  const stillActive =
    entry.listeners.likes.size +
      entry.listeners.interests.size +
      entry.listeners.comments.size +
      entry.statusListeners.size >
    0;
  if (stillActive) return;
  try {
    supabase.removeChannel(entry.channel);
  } catch {
    /* noop */
  }
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
  // Emit current status immediately so consumers don't have to wait.
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
