import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

/**
 * Posts a Swedish system message into the conversation thread. Marked as
 * is_system_message so it is rendered as a neutral note for both parties.
 */
export async function postPifSystemMessage(
  conversationId: string,
  content: string,
): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId || !conversationId) return;
    await (supabase.from("messages") as any).insert({
      conversation_id: conversationId,
      sender_id: userId,
      content,
      is_system_message: true,
    });
  } catch (err) {
    console.error("Failed to post pif system message:", err);
  }
}

export function usePifCompletion(
  conversationId: string | null,
  itemId: string | number | null | undefined,
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
      const { error } = await (supabase.rpc as any)("confirm_pif_handoff", {
        p_item_id: id,
        p_role: role,
      });
      if (error) {
        console.error("confirm_pif_handoff failed:", error);
        return { ok: false, error } as const;
      }
      // Optimistic local update
      setState((s) => ({
        ...s,
        pifferConfirmed: role === "piffer" ? true : s.pifferConfirmed,
        receiverConfirmed: role === "receiver" ? true : s.receiverConfirmed,
      }));
      if (conversationId) {
        const msg =
          role === "piffer"
            ? "Piffaren har bekräftat överlämning. Väntar på att mottagaren bekräftar mottagning."
            : "Mottagaren har bekräftat mottagning.";
        await postPifSystemMessage(conversationId, msg);

        // If both sides have now confirmed, post the completion message too.
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
    [id, conversationId, state.pifferConfirmed, state.receiverConfirmed],
  );

  const completeWithRating = useCallback(
    async (rating: number, comment?: string) => {
      if (id === null) return { ok: false } as const;
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
        // If receiver hadn't already confirmed, this is a hard-complete.
        if (!state.receiverConfirmed) {
          await postPifSystemMessage(
            conversationId,
            "Piffaren har markerat piffen som genomförd.",
          );
        }
        await postPifSystemMessage(
          conversationId,
          "Piffen är genomförd! Tack för att ni använde PIF. 🎉",
        );
        if (comment && comment.trim()) {
          await postPifSystemMessage(
            conversationId,
            `Piffaren lämnade följande omdöme: ${comment.trim()}`,
          );
        }
      }
      setState((s) => ({ ...s, pifStatus: "completed" }));
      return { ok: true } as const;
    },
    [id, conversationId, state.receiverConfirmed],
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
        const msg =
          action === "reopen"
            ? "Piffaren har ångrat valet av mottagare. Piffen är nu öppen igen."
            : "Piffaren har arkiverat piffen.";
        await postPifSystemMessage(conversationId, msg);
      }
      setState((s) => ({
        ...s,
        pifStatus: action === "archive" ? "archived" : s.pifStatus,
      }));
      return { ok: true } as const;
    },
    [id, conversationId],
  );

  return { ...state, confirmHandoff, completeWithRating, withdraw };
}
