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

  const applyRow = useCallback((row: any) => {
    if (!row) return;
    setState({
      pifferConfirmed: !!row.piffer_confirmed_handoff,
      receiverConfirmed: !!row.receiver_confirmed_receipt,
      pifStatus: (row.pif_status as string) || null,
      loading: false,
    });
  }, []);

  useEffect(() => {
    if (id === null) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    let cancelled = false;

    (async () => {
      const { data, error } = await (supabase
        .from("items") as any)
        .select("piffer_confirmed_handoff, receiver_confirmed_receipt, pif_status")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error("Failed to load pif completion state:", error);
        setState((s) => ({ ...s, loading: false }));
        return;
      }
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
      if (id === null) return { ok: false } as const;
      if (!(await ensureSession("confirm_pif_handoff"))) return { ok: false } as const;
      const { error } = await (supabase.rpc as any)("confirm_pif_handoff", {
        p_item_id: id,
        p_role: role,
      });
      if (error) {
        console.error("confirm_pif_handoff failed:", error);
        return { ok: false, error } as const;
      }
      setState((s) => ({
        ...s,
        pifferConfirmed: role === "piffer" ? true : s.pifferConfirmed,
        receiverConfirmed: role === "receiver" ? true : s.receiverConfirmed,
      }));
      if (conversationId) {
        if (role === "piffer") {
          // Piffer just confirmed handoff: tailored message to each side.
          await postPifSystemMessage(
            conversationId,
            "Du har bekräftat överlämning. Väntar på att mottagaren bekräftar mottagning.",
            { targetUserId: currentUserId ?? null },
          );
          await postPifSystemMessage(
            conversationId,
            "Piffaren har bekräftat överlämning. Väntar på att du bekräftar mottagning.",
            { targetUserId: otherUserId ?? null },
          );
        } else {
          // Receiver just confirmed receipt.
          await postPifSystemMessage(
            conversationId,
            "Du har bekräftat mottagning.",
            { targetUserId: currentUserId ?? null },
          );
          await postPifSystemMessage(
            conversationId,
            "Mottagaren har bekräftat mottagning.",
            { targetUserId: otherUserId ?? null },
          );
        }

        // If both sides have now confirmed, post the celebration message
        // visible to both parties.
        const both =
          (role === "piffer" && state.receiverConfirmed) ||
          (role === "receiver" && state.pifferConfirmed);
        if (both) {
          await postPifSystemMessage(
            conversationId,
            "Piffen är genomförd! Tack för att ni använde PIF. 🎉",
          );
        }
      }
      return { ok: true } as const;
    },
    [id, conversationId, currentUserId, otherUserId, state.pifferConfirmed, state.receiverConfirmed],
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
      const { error } = await (supabase.rpc as any)(
        "complete_pif_with_rating",
        args,
      );
      if (error) {
        console.error("complete_pif_with_rating failed:", error);
        return { ok: false, error } as const;
      }
      if (conversationId) {
        // Hard-complete path: receiver hadn't confirmed yet.
        if (!state.receiverConfirmed) {
          await postPifSystemMessage(
            conversationId,
            "Du markerade piffen som genomförd.",
            { targetUserId: currentUserId ?? null },
          );
          await postPifSystemMessage(
            conversationId,
            "Piffaren har markerat piffen som genomförd.",
            { targetUserId: otherUserId ?? null },
          );
        }
        await postPifSystemMessage(
          conversationId,
          "Piffen är genomförd! Tack för att ni använde PIF. 🎉",
        );
        // The star rating itself stays private. Only post a system message
        // if the piffer left a written comment — visible to both parties.
        if (comment && comment.trim()) {
          await postPifSystemMessage(
            conversationId,
            `Kommentar från piffaren: ${comment.trim()}`,
          );
        }
      }
      setState((s) => ({ ...s, pifStatus: "completed" }));
      return { ok: true } as const;
    },
    [id, conversationId, currentUserId, otherUserId, state.receiverConfirmed],
  );

  const withdraw = useCallback(
    async (action: "reopen" | "archive") => {
      if (id === null) return { ok: false } as const;
      const { error } = await (supabase.rpc as any)("withdraw_pif", {
        p_item_id: id,
        p_action: action,
      });
      if (error) {
        console.error("withdraw_pif failed:", error);
        return { ok: false, error } as const;
      }
      if (conversationId) {
        if (action === "reopen") {
          await postPifSystemMessage(
            conversationId,
            "Du har ångrat valet av mottagare. Piffen är nu öppen igen.",
            { targetUserId: currentUserId ?? null },
          );
          await postPifSystemMessage(
            conversationId,
            "Piffaren har ångrat sig och kan/vill inte längre piffa detta till dig. Piffen är nu öppen för andra att visa intresse.",
            { targetUserId: otherUserId ?? null },
          );
        } else {
          await postPifSystemMessage(
            conversationId,
            "Du har arkiverat piffen.",
            { targetUserId: currentUserId ?? null },
          );
          await postPifSystemMessage(
            conversationId,
            "Piffaren har ångrat sig och kan/vill inte längre piffa detta.",
            { targetUserId: otherUserId ?? null },
          );
        }
      }
      setState((s) => ({
        ...s,
        pifStatus: action === "archive" ? "archived" : s.pifStatus,
      }));
      return { ok: true } as const;
    },
    [id, conversationId, currentUserId, otherUserId],
  );

  return { ...state, confirmHandoff, completeWithRating, withdraw };
}
