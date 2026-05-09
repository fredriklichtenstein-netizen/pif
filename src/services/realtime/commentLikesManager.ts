import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { isAuthRequestCircuitOpen, openAuthRequestCircuit } from "@/hooks/auth/sessionRecovery";

/**
 * Single shared global channel for `comment_likes` realtime events.
 * `comment_likes` is not filterable by item_id at the row level, so all
 * consumers share one subscription and filter locally by the comments
 * they're rendering.
 *
 * Self-heals on CHANNEL_ERROR / TIMED_OUT / CLOSED with exponential
 * backoff, and forces an immediate reconnect when the tab becomes
 * visible or the network returns.
 */

export type Listener = (payload: any) => void;

let channel: RealtimeChannel | null = null;
const listeners = new Set<Listener>();
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryCount = 0;
const BACKOFFS_MS = [1000, 2000, 5000, 10000, 15000];
const MAX_RECONNECT_ATTEMPTS = 5;

const teardown = () => {
  if (channel) {
    try {
      supabase.removeChannel(channel);
    } catch {
      /* noop */
    }
    channel = null;
  }
};

const build = () => {
  if (isAuthRequestCircuitOpen()) return;
  channel = supabase
    .channel(`comment-likes-shared-${Date.now()}`)
    .on(
      "postgres_changes" as any,
      { event: "*", schema: "public", table: "comment_likes" },
      (payload: any) => {
        listeners.forEach((cb) => {
          try {
            cb(payload);
          } catch (err) {
            console.warn("[commentLikesManager] listener error", err);
          }
        });
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        retryCount = 0;
        return;
      }
      if (
        status === "CHANNEL_ERROR" ||
        status === "TIMED_OUT" ||
        status === "CLOSED"
      ) {
        if (retryTimer || listeners.size === 0) return;
        if (isAuthRequestCircuitOpen()) return;
        if (retryCount >= MAX_RECONNECT_ATTEMPTS) {
          openAuthRequestCircuit("comment likes realtime retry limit");
          console.warn("[commentLikesManager] reconnect circuit opened", { attempts: retryCount });
          return;
        }
        const delay = BACKOFFS_MS[Math.min(retryCount, BACKOFFS_MS.length - 1)];
        retryTimer = setTimeout(() => {
          retryTimer = null;
          retryCount += 1;
          teardown();
          if (listeners.size > 0) build();
        }, delay);
      }
    });
};

export const subscribeCommentLikes = (listener: Listener): (() => void) => {
  listeners.add(listener);
  if (!channel) build();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      teardown();
    }
  };
};

const forceReconnect = () => {
  if (listeners.size === 0) return;
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  retryCount = 0;
  teardown();
  build();
};

if (typeof window !== "undefined") {
  window.addEventListener("online", forceReconnect);
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") forceReconnect();
  });
}
