import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/hooks/auth/authStore";
import { useTermsStore } from "@/stores/termsStore";
import { PifRatingModal } from "@/components/messaging/PifRatingModal";
import { postPifSystemMessage } from "@/hooks/usePifCompletion";
import { rememberRatingSkipped, ratingSkipped } from "@/lib/ratingSkip";
import { TERMS_SCREEN_EXEMPT_PATHS } from "@/lib/terms";

/** How long after a post is completed its rater is still asked. */
const ASK_WITHIN_DAYS = 30;

interface Pending {
  itemId: number;
  title: string;
  isWish: boolean;
  /** The person being rated (a pif's receiver / a wish's owner). */
  rateeId: string;
}

/**
 * Rating prompt wherever the rater is in the app (staging test 2026-11-26):
 * the other side often completes the post while the rater is elsewhere, and
 * the chat then sits under "Historik", so a prompt only in the chat is easily
 * never seen.
 * - pif: the piffer rates the receiver (receiver_rating);
 * - wish: a helper rates the wisher (owner_rating).
 * Asks once per post completed in the last 30 days that they haven't rated;
 * rated or "Hoppa över" (remembered on the device, shared with the chat's
 * prompt) and it doesn't ask again. Not on the messages page (the chat asks
 * there), sign-in pages, or over the terms screen. Mounted in App.
 */
export function RatingPrompt() {
  const { t } = useTranslation();
  const location = useLocation();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const profileCompleted = useAuthStore((s) => s.profileCompleted);
  const termsScreenOpen = useTermsStore((s) => s.screenOpen);
  const [queue, setQueue] = useState<Pending[]>([]);

  useEffect(() => {
    if (!userId || profileCompleted !== true) {
      setQueue([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      // Ratings aren't readable from the table (privacy, 2026-11-27):
      // get_pending_ratings works out, server-side, which posts the caller
      // should rate (pif's piffer -> receiver, wish's helper -> wisher).
      const { data, error } = await (supabase.rpc as any)("get_pending_ratings", {
        p_days: ASK_WITHIN_DAYS,
      });
      if (cancelled || error || !Array.isArray(data)) return;
      const pending: Pending[] = [];
      const seen = new Set<number>();
      for (const row of data as Array<{ item_id: number; title: string | null; is_wish: boolean; ratee_id: string }>) {
        const id = Number(row.item_id);
        if (seen.has(id) || ratingSkipped(id)) continue;
        seen.add(id);
        pending.push({ itemId: id, title: row.title ?? "", isWish: !!row.is_wish, rateeId: row.ratee_id });
      }
      setQueue(pending);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, profileCompleted]);

  const current = queue[0];
  const onExemptPage = TERMS_SCREEN_EXEMPT_PATHS.some(
    (p) => location.pathname === p || location.pathname.startsWith(`${p}/`),
  );
  const inMessages = location.pathname.startsWith("/messages");
  const open = !!current && !termsScreenOpen && !onExemptPage && !inMessages;

  const done = () => {
    if (current) rememberRatingSkipped(current.itemId);
    setQueue((q) => q.slice(1));
  };

  /** The conversation between me and the ratee about this post, for a comment. */
  const findConversation = async (p: Pending): Promise<string | null> => {
    const { data: convs } = await (supabase.from("conversations") as any)
      .select("id")
      .eq("item_id", p.itemId)
      .order("created_at", { ascending: false });
    const ids: string[] = Array.isArray(convs) ? convs.map((c: any) => c.id) : [];
    if (ids.length <= 1) return ids[0] ?? null;
    const { data: parts } = await (supabase.rpc as any)("get_conversation_participants", {
      p_conversation_ids: ids,
    });
    const match = Array.isArray(parts) ? parts.find((x: any) => x.user_id === p.rateeId) : null;
    return match?.conversation_id ?? ids[0];
  };

  if (!current) return null;

  return (
    <PifRatingModal
      open={open}
      onOpenChange={(o) => {
        if (!o) done();
      }}
      mode="rate"
      ratee={current.isWish ? "wisher" : "receiver"}
      isRequest={current.isWish}
      context={
        current.title
          ? t(current.isWish ? "interactions.rate_wisher_context" : "interactions.rate_receiver_context", {
              title: current.title,
            })
          : undefined
      }
      onSubmit={async (rating, comment) => {
        const { error } = await (supabase.rpc as any)("rate_after_handover", {
          p_item_id: current.itemId,
          p_rating: rating,
          p_comment: comment?.trim() || null,
        });
        if (error) {
          console.error("[RatingPrompt] rate_after_handover failed", error);
          return { ok: false };
        }
        if (comment && comment.trim()) {
          const convId = await findConversation(current);
          if (convId) {
            await postPifSystemMessage(
              convId,
              current.isWish
                ? `Kommentar från den som uppfyllde önskan: ${comment.trim()}`
                : `Kommentar från piffaren: ${comment.trim()}`,
            );
          }
        }
        return { ok: true };
      }}
    />
  );
}
