import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/hooks/auth/authStore";
import { useTermsStore } from "@/stores/termsStore";
import { PifRatingModal } from "@/components/messaging/PifRatingModal";
import { postPifSystemMessage } from "@/hooks/usePifCompletion";
import { rememberWishRatingSkipped, wishRatingSkipped } from "@/lib/wishRatingSkip";
import { TERMS_SCREEN_EXEMPT_PATHS } from "@/lib/terms";

/** How long after a wish is fulfilled its helper is still asked. */
const ASK_WITHIN_DAYS = 30;

interface Pending {
  itemId: number;
  title: string;
}

/**
 * "Betygsätt önskaren" for wish helpers, wherever they are in the app
 * (staging test 2026-11-26): the wisher often completes the wish while the
 * helper is elsewhere, and the chat then sits under "Historik", so a prompt
 * only in the chat is easily never seen. Asks once per wish (rated, or
 * "Hoppa över" remembered on the device -- shared with the chat's prompt).
 * Mounted in App.
 */
export function WishRatingPrompt() {
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
      const { data, error } = await (supabase.from("interests") as any)
        .select("item_id, owner_rating, item:items(id, title, pif_status, item_type, completed_at, user_id)")
        .eq("user_id", userId)
        .eq("status", "selected")
        .is("owner_rating", null);
      if (cancelled || error || !Array.isArray(data)) return;
      const since = Date.now() - ASK_WITHIN_DAYS * 24 * 60 * 60 * 1000;
      const pending: Pending[] = [];
      for (const row of data as any[]) {
        const it = row.item;
        if (!it || it.item_type !== "request" || it.pif_status !== "completed") continue;
        if (it.user_id === userId) continue;
        if (!it.completed_at || new Date(it.completed_at).getTime() < since) continue;
        if (wishRatingSkipped(it.id)) continue;
        pending.push({ itemId: Number(it.id), title: it.title ?? "" });
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
  // The chat asks by itself; don't show a second dialog on top of it.
  const inChat = location.pathname.startsWith("/messages");
  const open = !!current && !termsScreenOpen && !onExemptPage && !inChat;

  const done = () => {
    if (current) rememberWishRatingSkipped(current.itemId);
    setQueue((q) => q.slice(1));
  };

  if (!current) return null;

  return (
    <PifRatingModal
      open={open}
      onOpenChange={(o) => {
        if (!o) done();
      }}
      mode="rate"
      ratee="wisher"
      isRequest
      context={current.title ? t("interactions.rate_wisher_context", { title: current.title }) : undefined}
      onSubmit={async (rating, comment) => {
        const { error } = await (supabase.rpc as any)("rate_after_handover", {
          p_item_id: current.itemId,
          p_rating: rating,
          p_comment: comment?.trim() || null,
        });
        if (error) {
          console.error("[WishRatingPrompt] rate_after_handover failed", error);
          return { ok: false };
        }
        if (comment && comment.trim()) {
          // RLS only returns the helper's own conversation(s) about this wish.
          const { data: convs } = await (supabase.from("conversations") as any)
            .select("id")
            .eq("item_id", current.itemId)
            .limit(1);
          const convId = Array.isArray(convs) && convs[0]?.id;
          if (convId) {
            await postPifSystemMessage(convId, `Kommentar från den som uppfyllde önskan: ${comment.trim()}`);
          }
        }
        return { ok: true };
      }}
    />
  );
}
