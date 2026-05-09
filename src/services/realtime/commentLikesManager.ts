import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Single shared global channel for `comment_likes` realtime events.
 * `comment_likes` is not filterable by item_id at the row level in our
 * schema today, so all consumers share one subscription and filter
 * locally by the comments they're rendering.
 */

export type Listener = (payload: any) => void;

let channel: RealtimeChannel | null = null;
const listeners = new Set<Listener>();

export const subscribeCommentLikes = (listener: Listener): (() => void) => {
  listeners.add(listener);
  if (!channel) {
    channel = supabase
      .channel("comment-likes-shared")
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
      .subscribe();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && channel) {
      try {
        supabase.removeChannel(channel);
      } catch {
        /* noop */
      }
      channel = null;
    }
  };
};
