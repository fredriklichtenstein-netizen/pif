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
      const since = Date.now() - ASK_WITHIN_DAYS * 24 * 60 * 60 * 1000;
      const recent = (it: any) =>
        it && it.pif_status === "completed" && it.completed_at && new Date(it.completed_at).getTime() >= since;
      const itemCols = "id, title, pif_status, item_type, completed_at, completed_outside_app, user_id";

      const [helping, giving] = await Promise.all([
        // Wishes I helped with and haven't rated the wisher on.
        (supabase.from("interests") as any)
          .select(`item_id, item:items(${itemCols})`)
          .eq("user_id", userId)
          .eq("status", "selected")
          .is("owner_rating", null),
        // My pifs whose receiver I haven't rated.
        (supabase.from("interests") as any)
          .select(`item_id, user_id, item:items!inner(${itemCols})`)
          .eq("status", "selected")
          .is("receiver_rating", null)
          .eq("item.user_id", userId)
          .eq("item.item_type", "offer")
          .eq("item.pif_status", "completed"),
      ]);
      if (cancelled) return;

      const pending: Pending[] = [];
      const seen = new Set<number>();
      for (const row of (helping.error ? [] : helping.data ?? []) as any[]) {
        const it = row.item;
        if (!recent(it) || it.item_type !== "request" || it.user_id === userId) continue;
        if (ratingSkipped(it.id) || seen.has(Number(it.id))) continue;
        seen.add(Number(it.id));
        pending.push({ itemId: Number(it.id), title: it.title ?? "", isWish: true, rateeId: it.user_id });
      }
      for (const row of (giving.error ? [] : giving.data ?? []) as any[]) {
        const it = row.item;
        // Given away outside the app: nobody here received it.
        if (!recent(it) || it.completed_outside_app || row.user_id === userId) continue;
        if (ratingSkipped(it.id) || seen.has(Number(it.id))) continue;
        seen.add(Number(it.id));
        pending.push({ itemId: Number(it.id), title: it.title ?? "", isWish: false, rateeId: row.user_id });
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
