import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { debugLog } from "@/utils/authDebug";
import { toast } from "@/hooks/use-toast";

/**
 * Verify a hydrated Supabase session exists before invoking auth-sensitive
 * RPCs. Returns the session if valid; otherwise logs + toasts and returns null.
 */
async function ensureSession(label: string) {
  try {
    const [{ data: sessData }, { data: userData }] = await Promise.all([
      supabase.auth.getSession(),
      supabase.auth.getUser(),
    ]);
    const session = sessData?.session ?? null;
    debugLog("rpc", `pre-RPC auth probe: ${label}`, {
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      sessionUserId: session?.user?.id ?? null,
      getUserId: userData?.user?.id ?? null,
    });
    if (!session?.access_token) {
      console.error(`[rpc] ${label}: no session/access_token; aborting RPC`);
      toast({
        title: "Du måste vara inloggad",
        description: "Sessionen kunde inte verifieras. Logga in igen och försök på nytt.",
        variant: "destructive",
      });
      return null;
    }
    return session;
  } catch (err) {
    console.error(`[rpc] ${label}: ensureSession threw`, err);
    return null;
  }
}

export type PifRole = "piffer" | "receiver";

export interface PifCompletionState {
  pifferConfirmed: boolean;
  receiverConfirmed: boolean;
  pifStatus: string | null;
  loading: boolean;
}

const numericItemId = (id: string | number | null | undefined): number | null => {
  if (id === null || id === undefined) return null;
  const n = typeof id === "number" ? id : parseInt(String(id), 10);
  return Number.isFinite(n) ? n : null;
};

interface SystemMessageOptions {
  /** When set, only this user sees the message (filtered in ConversationView). */
  targetUserId?: string | null;
}

/**
 * Posts a Swedish system message into the conversation thread. Marked as
 * is_system_message so it is rendered as a neutral note. When
 * `targetUserId` is provided the message is only shown to that user — used
 * to deliver second-person ("du/dig") variants of completion-flow updates.
 */
export async function postPifSystemMessage(
  conversationId: string,
  content: string,
  options: SystemMessageOptions = {},
): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId || !conversationId) return;
    const payload: Record<string, unknown> = {
      conversation_id: conversationId,
      sender_id: userId,
      content,
      is_system_message: true,
    };
    if (options.targetUserId) payload.target_user_id = options.targetUserId;
    await (supabase.from("messages") as any).insert(payload);
  } catch (err) {
    console.error("Failed to post pif system message:", err);
  }
}

export function usePifCompletion(
  conversationId: string | null,
  itemId: string | number | null | undefined,
  /** Current viewer's user id (the piffer or receiver acting on the UI). */
  currentUserId?: string | null,
  /** The other participant's user id; used to target second-person messages. */
  otherUserId?: string | null,
) {
  const id = numericItemId(itemId);
  const [state, setState] = useState<PifCompletionState>({
    pifferConfirmed: false,
    receiverConfirmed: false,
    pifStatus: null,
    loading: true,
  });
  // Whether the underlying item is a wish (item_type='request'). Drives
  // wish-vs-pif copy in every system message posted from this hook. Fetched
  // once with the initial items row; item_type does not change after creation.
  const [isRequest, setIsRequest] = useState(false);

  const applyRow = useCallback((row: any) => {
    if (!row) return;
    const nextStatus = (row.pif_status as string) || null;
    console.log("[usePifCompletion] completion row applied", {
      itemId: id,
      pifStatus: nextStatus,
      pifferConfirmed: !!row.piffer_confirmed_handoff,
      receiverConfirmed: !!row.receiver_confirmed_receipt,
    });
    setState((prev) => {
      // Notify listeners (e.g. conversation list) the first time we
      // observe a terminal pif_status so Aktiva → Historik moves happen
      // immediately without a refetch or page refresh.
      if (
        (nextStatus === "completed" || nextStatus === "archived") &&
        prev.pifStatus !== nextStatus &&
        id !== null &&
        typeof window !== "undefined"
      ) {
        try {
          window.dispatchEvent(
            new CustomEvent("pif:status-changed", {
              detail: { itemId: id, pifStatus: nextStatus },
            }),
          );
        } catch {
          /* noop */
        }
      }
      return {
        pifferConfirmed: !!row.piffer_confirmed_handoff,
        receiverConfirmed: !!row.receiver_confirmed_receipt,
        pifStatus: nextStatus,
        loading: false,
      };
    });
  }, [id]);

  useEffect(() => {
    if (id === null) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    let cancelled = false;

    (async () => {
      const { data, error } = await (supabase
        .from("items") as any)
        .select("piffer_confirmed_handoff, receiver_confirmed_receipt, pif_status, item_type")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error("Failed to load pif completion state:", error);
        setState((s) => ({ ...s, loading: false }));
        return;
      }
      const nextIsRequest =
        String((data as any)?.item_type || "offer").toLowerCase() === "request";
      setIsRequest(nextIsRequest);
      console.log("[copy-audit] usePifCompletion isRequest derived", {
        itemId: id,
        rawItemType: (data as any)?.item_type ?? null,
        isRequest: nextIsRequest,
      });
      applyRow(data);
    })();

    const channel = supabase
      .channel(`pif-completion:${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "items",
          filter: `id=eq.${id}`,
        },
        (payload) => applyRow(payload.new),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [id, applyRow]);

  const confirmHandoff = useCallback(
    async (role: PifRole) => {
      if (id === null) {
        console.log("[usePifCompletion] confirmHandoff aborted before RPC: missing item id", {
          role,
          conversationId,
          currentUserId: currentUserId ?? null,
          otherUserId: otherUserId ?? null,
        });
        return { ok: false } as const;
      }
      if (!(await ensureSession("confirm_pif_handoff"))) return { ok: false } as const;
      console.log("[usePifCompletion] calling confirm_pif_handoff RPC", {
        p_item_id: id,
        p_role: role,
        conversationId,
        currentUserId: currentUserId ?? null,
        otherUserId: otherUserId ?? null,
      });
      let { error } = await (supabase.rpc as any)("confirm_pif_handoff", {
        p_item_id: id,
        p_role: role,
      });
      if (error && (error.code === "42501" || /not authorized/i.test(error.message || ""))) {
        console.warn("[rpc] confirm_pif_handoff 42501; refreshing session and retrying once");
        await new Promise((r) => setTimeout(r, 500));
        const { data: refreshed } = await supabase.auth.getSession();
        debugLog("rpc", "confirm_pif_handoff retry session probe", {
          hasSession: !!refreshed?.session,
          hasAccessToken: !!refreshed?.session?.access_token,
        });
        if (!refreshed?.session?.access_token) {
          toast({
            title: "Du måste vara inloggad",
            description: "Sessionen kunde inte verifieras. Logga in igen och försök på nytt.",
            variant: "destructive",
          });
          return { ok: false, error } as const;
        }
        ({ error } = await (supabase.rpc as any)("confirm_pif_handoff", {
          p_item_id: id,
          p_role: role,
        }));
      }
      if (error) {
        console.error("confirm_pif_handoff failed:", error);
        return { ok: false, error } as const;
      }
      const { data: latestRow, error: latestErr } = await (supabase.from("items") as any)
        .select("piffer_confirmed_handoff, receiver_confirmed_receipt, pif_status")
        .eq("id", id)
        .maybeSingle();
      if (latestErr) {
        console.warn("[usePifCompletion] post-confirm item refetch failed", latestErr);
      }
      const nextPifferConfirmed = latestRow
        ? !!latestRow.piffer_confirmed_handoff
        : role === "piffer" || state.pifferConfirmed;
      const nextReceiverConfirmed = latestRow
        ? !!latestRow.receiver_confirmed_receipt
        : role === "receiver" || state.receiverConfirmed;
      const nextStatus = (latestRow?.pif_status as string | undefined) || null;
      const both =
        nextPifferConfirmed && nextReceiverConfirmed;
      setState((s) => ({
        ...s,
        pifferConfirmed: nextPifferConfirmed,
        receiverConfirmed: nextReceiverConfirmed,
        pifStatus: both ? "completed" : nextStatus ?? s.pifStatus,
      }));
      if (conversationId) {
        const pick = (pif: string, wish: string) => (isRequest ? wish : pif);
        if (role === "piffer") {
          const receiverAlreadyConfirmed = nextReceiverConfirmed;
          if (!receiverAlreadyConfirmed) {
            // Piffer confirms first.
            await postPifSystemMessage(
              conversationId,
              pick(
                "Du har bekräftat överlämning. Väntar på att mottagaren bekräftar mottagning.",
                "Du har bekräftat att önskan är uppfylld. Väntar på att den som uppfyllde önskan också bekräftar.",
              ),
              { targetUserId: currentUserId ?? null },
            );
            await postPifSystemMessage(
              conversationId,
              pick(
                "Piffaren har bekräftat överlämning. Väntar på att du bekräftar mottagning.",
                "Önskaren har bekräftat att önskan är uppfylld. Väntar på att du också bekräftar.",
              ),
              { targetUserId: otherUserId ?? null },
            );
          } else {
            // Piffer confirms second.
            await postPifSystemMessage(
              conversationId,
              pick(
                "Du har bekräftat överlämning.",
                "Du har bekräftat att önskan är uppfylld.",
              ),
              { targetUserId: currentUserId ?? null },
            );
            await postPifSystemMessage(
              conversationId,
              pick(
                "Piffaren har bekräftat överlämning.",
                "Önskaren har bekräftat att önskan är uppfylld.",
              ),
              { targetUserId: otherUserId ?? null },
            );
          }
        } else {
          const pifferAlreadyConfirmed = nextPifferConfirmed;
          if (!pifferAlreadyConfirmed) {
            // Receiver confirms first.
            await postPifSystemMessage(
              conversationId,
              pick(
                "Du har bekräftat mottagning. Väntar på att piffaren bekräftar överlämning.",
                "Du har bekräftat att önskan är uppfylld. Väntar på att önskaren också bekräftar.",
              ),
              { targetUserId: currentUserId ?? null },
            );
            await postPifSystemMessage(
              conversationId,
              pick(
                "Mottagaren har bekräftat mottagning. Väntar på att du bekräftar överlämning.",
                "Den som uppfyllde önskan har bekräftat. Väntar på att du också bekräftar.",
              ),
              { targetUserId: otherUserId ?? null },
            );
          } else {
            // Receiver confirms second.
            await postPifSystemMessage(
              conversationId,
              pick(
                "Du har bekräftat mottagning.",
                "Du har bekräftat att önskan är uppfylld.",
              ),
              { targetUserId: currentUserId ?? null },
            );
            await postPifSystemMessage(
              conversationId,
              pick(
                "Mottagaren har bekräftat mottagning.",
                "Den som uppfyllde önskan har bekräftat.",
              ),
              { targetUserId: otherUserId ?? null },
            );
          }
        }

        // If both sides have now confirmed, post the celebration message
        // visible to both parties. The piffer-side rating modal that
        // opens next must NOT post this again (handled in
        // completeWithRating below).
        if (both) {
          await postPifSystemMessage(
            conversationId,
            pick(
              "Pifen är genomförd! Tack för att ni använde PIF. 🎉",
              "Önskan är uppfylld! Tack för att ni använde PIF. 🎉",
            ),
          );
        }
      }
      return { ok: true } as const;
    },
    [id, conversationId, currentUserId, otherUserId, isRequest, state.pifferConfirmed, state.receiverConfirmed],
  );

  const completeWithRating = useCallback(
    async (rating: number, comment?: string) => {
      if (id === null) return { ok: false } as const;
      if (!(await ensureSession("complete_pif_with_rating"))) return { ok: false } as const;
      const args: Record<string, unknown> = {
        p_item_id: id,
        p_rating: rating,
      };
      if (comment && comment.trim()) args.p_comment = comment.trim();
      debugLog("rpc", "complete_pif_with_rating args", {
        p_item_id: id,
        p_rating: rating,
        hasComment: !!(comment && comment.trim()),
      });
      const { error } = await (supabase.rpc as any)(
        "complete_pif_with_rating",
        args,
      );
      if (error) {
        console.error("complete_pif_with_rating failed:", error);
        return { ok: false, error } as const;
      }
      if (conversationId) {
        const pick = (pif: string, wish: string) => (isRequest ? wish : pif);
        // Hard-complete path: receiver hadn't confirmed yet. Only this
        // path posts the "Du markerade..." messages AND the celebration
        // message — when both sides already confirmed, the celebration
        // was already posted by confirmHandoff and must not be repeated.
        if (!state.receiverConfirmed) {
          await postPifSystemMessage(
            conversationId,
            pick(
              "Du markerade pifen som genomförd.",
              "Du markerade önskan som uppfylld.",
            ),
            { targetUserId: currentUserId ?? null },
          );
          await postPifSystemMessage(
            conversationId,
            pick(
              "Piffaren har markerat pifen som genomförd.",
              "Önskaren har markerat önskan som uppfylld.",
            ),
            { targetUserId: otherUserId ?? null },
          );
          await postPifSystemMessage(
            conversationId,
            pick(
              "Pifen är genomförd! Tack för att ni använde PIF. 🎉",
              "Önskan är uppfylld! Tack för att ni använde PIF. 🎉",
            ),
          );
        }
        // The star rating itself stays private. Only post a system message
        // if the piffer left a written comment — visible to both parties.
        if (comment && comment.trim()) {
          await postPifSystemMessage(
            conversationId,
            pick(
              `Kommentar från piffaren: ${comment.trim()}`,
              `Kommentar från önskaren: ${comment.trim()}`,
            ),
          );
        }
      }
      // Fan-out completion notifications to the receiver + piffer.
      try {
        const event = isRequest ? "wish_completed" : "pif_completed";
        await (supabase.rpc as any)("notify_item_interest_event", {
          p_item_id: id,
          p_event: event,
          p_selected_user_id: otherUserId ?? null,
        });
      } catch (e) {
        console.warn("notify_item_interest_event (complete) failed", e);
      }
      setState((s) => ({ ...s, pifStatus: "completed" }));
      return { ok: true } as const;
    },
    [id, conversationId, currentUserId, otherUserId, isRequest, state.receiverConfirmed],
  );

  const withdraw = useCallback(
    async (action: "reopen" | "archive") => {
      if (id === null) return { ok: false } as const;
      if (!(await ensureSession("withdraw_pif"))) return { ok: false } as const;
      const { error } = await (supabase.rpc as any)("withdraw_pif", {
        p_item_id: id,
        p_action: action,
        // Wishes (item_type='request') must scope withdrawal to the specific
        // fulfiller in this conversation; otherwise the RPC raises 22023.
        // Pifs (offers) ignore this argument server-side.
        p_fulfiller_id: isRequest ? (otherUserId ?? null) : null,
      });
      if (error) {
        console.error("withdraw_pif failed:", error);
        return { ok: false, error } as const;
      }
      if (conversationId) {
        const pick = (pif: string, wish: string) => (isRequest ? wish : pif);
        if (action === "reopen") {
          // Note: for wishes the "is now open again" framing is intentionally
          // dropped because withdraw_pif's current behaviour for wishes does
          // not necessarily map to a closed→open transition (see plan.md
          // entry on withdraw_pif multi-fulfiller bug).
          await postPifSystemMessage(
            conversationId,
            pick(
              "Du har ångrat valet av mottagare. Pifen är nu öppen igen.",
              "Du har ångrat valet av den som skulle uppfylla önskan.",
            ),
            { targetUserId: currentUserId ?? null },
          );
          await postPifSystemMessage(
            conversationId,
            pick(
              "Piffaren har ångrat sig och kan/vill inte längre piffa detta till dig. Pifen är nu öppen för andra att visa intresse.",
              "Önskaren har ångrat sitt val. Du har inte längre uppdraget att uppfylla denna önskan.",
            ),
            { targetUserId: otherUserId ?? null },
          );
        } else {
          await postPifSystemMessage(
            conversationId,
            pick(
              "Du har arkiverat pifen.",
              "Du har arkiverat önskan.",
            ),
            { targetUserId: currentUserId ?? null },
          );
          await postPifSystemMessage(
            conversationId,
            pick(
              "Piffaren har ångrat sig och kan/vill inte längre piffa detta.",
              "Önskaren har ångrat sig och vill inte längre att önskan uppfylls.",
            ),
            { targetUserId: otherUserId ?? null },
          );
        }
      }
      // Notify ALL interested users (selected + the rest) of the change.
      try {
        const event =
          action === "reopen"
            ? isRequest ? "wish_reopened" : "pif_reopened"
            : isRequest ? "wish_archived" : "pif_archived";
        await (supabase.rpc as any)("notify_item_interest_event", {
          p_item_id: id,
          p_event: event,
          p_selected_user_id: otherUserId ?? null,
        });
      } catch (e) {
        console.warn("notify_item_interest_event (withdraw) failed", e);
      }
      setState((s) => ({
        ...s,
        pifStatus: action === "archive" ? "archived" : s.pifStatus,
      }));
      // Ask consumers (useConversationDetails, useConversations) to refetch
      // so freshly-set conversations.closed_at is reflected without reload.
      try {
        window.dispatchEvent(
          new CustomEvent('pif:conversation-refetch', {
            detail: { conversationId },
          }),
        );
        window.dispatchEvent(new CustomEvent('pif:conversations-refresh'));
      } catch {
        /* no-op in non-DOM environments */
      }
      return { ok: true } as const;
    },
    [id, conversationId, currentUserId, otherUserId, isRequest],
  );

  const undoConfirmation = useCallback(
    async (role: PifRole) => {
      if (id === null) return { ok: false } as const;
      if (!(await ensureSession("undo_pif_handoff_confirmation"))) {
        return { ok: false } as const;
      }
      const { data, error } = await (supabase.rpc as any)(
        "undo_pif_handoff_confirmation",
        { p_item_id: id, p_role: role },
      );
      if (error) {
        console.error("undo_pif_handoff_confirmation failed:", error);
        toast({
          title: "Det gick inte att ångra",
          description: error.message || "Försök igen.",
          variant: "destructive",
        });
        return { ok: false, error } as const;
      }
      // Refetch fresh row so local UI reflects the cleared flags.
      const { data: latestRow } = await (supabase.from("items") as any)
        .select("piffer_confirmed_handoff, receiver_confirmed_receipt, pif_status")
        .eq("id", id)
        .maybeSingle();
      if (latestRow) applyRow(latestRow);

      if (conversationId) {
        const pick = (pif: string, wish: string) => (isRequest ? wish : pif);
        if (role === "piffer") {
          const bothCleared = !!(data && (data as any).receiver_was_confirmed);
          if (bothCleared) {
            await postPifSystemMessage(
              conversationId,
              pick(
                "Piffaren har ångrat sin bekräftelse av överlämning. Utbytet är inte slutfört.",
                "Önskaren har ångrat sin bekräftelse. Utbytet är inte slutfört.",
              ),
            );
          } else {
            await postPifSystemMessage(
              conversationId,
              pick(
                "Du har ångrat din bekräftelse av överlämning.",
                "Du har ångrat din bekräftelse.",
              ),
              { targetUserId: currentUserId ?? null },
            );
            await postPifSystemMessage(
              conversationId,
              pick(
                "Piffaren har ångrat sin bekräftelse av överlämning.",
                "Önskaren har ångrat sin bekräftelse.",
              ),
              { targetUserId: otherUserId ?? null },
            );
          }
        } else {
          await postPifSystemMessage(
            conversationId,
            pick(
              "Mottagaren har ångrat sin bekräftelse. Utbytet är inte slutfört.",
              "Den som uppfyller önskan har ångrat sin bekräftelse. Utbytet är inte slutfört.",
            ),
          );
        }
      }
      return { ok: true } as const;
    },
    [id, conversationId, currentUserId, otherUserId, isRequest, applyRow],
  );

  return { ...state, isRequest, confirmHandoff, completeWithRating, withdraw, undoConfirmation };
}
