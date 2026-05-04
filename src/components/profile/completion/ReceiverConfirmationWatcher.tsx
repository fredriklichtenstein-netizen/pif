import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { DEMO_MODE } from "@/config/demoMode";
import { ReceiverConfirmation } from "./ReceiverConfirmation";

/**
 * Globally watches for items where the current user is the selected receiver.
 * When the piffer marks the item as `pif_status = 'piffed'`, we surface the
 * receiver confirmation dialog so the receiver can confirm pickup from anywhere
 * in the app.
 *
 * Notes:
 * - Demo Mode is a no-op: the in-app PostModal already drives the demo flow.
 * - We track a small set of "watched" item ids (those the user is selected on)
 *   and listen to UPDATE events on `items` filtered by those ids.
 */
type Pending = {
  itemId: number;
  itemTitle: string;
  pifferName: string;
  pifferId?: string;
};

export function ReceiverConfirmationWatcher() {
  const { user } = useGlobalAuth();
  const [pending, setPending] = useState<Pending | null>(null);
  // Avoid re-prompting for the same item within a session.
  const promptedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (DEMO_MODE) return;
    if (!user?.id) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const init = async () => {
      // Find items where this user is the currently selected receiver.
      const { data: selectedInterests, error } = await supabase
        .from("interests")
        .select("item_id")
        .eq("user_id", user.id)
        .eq("status", "selected");

      if (error || cancelled || !selectedInterests || selectedInterests.length === 0) return;

      const ids = selectedInterests
        .map((row: any) => Number(row.item_id))
        .filter((n) => Number.isFinite(n));

      if (ids.length === 0) return;

      // For any item already in `piffed` state at mount time, prompt immediately.
      const { data: items } = await supabase
        .from("items")
        .select("id, title, pif_status, user_id, profiles:profiles!items_user_id_fkey(first_name)")
        .in("id", ids);

      const piffedNow = (items || []).find((it: any) => it.pif_status === "piffed");
      if (piffedNow && !promptedRef.current.has(piffedNow.id)) {
        promptedRef.current.add(piffedNow.id);
        setPending({
          itemId: piffedNow.id,
          itemTitle: piffedNow.title,
          pifferName: (piffedNow as any).profiles?.first_name || "",
          pifferId: piffedNow.user_id,
        });
      }

      // Subscribe to future status changes on these items.
      channel = supabase
        .channel(`receiver-watch:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "items",
            filter: `id=in.(${ids.join(",")})`,
          },
          async (payload: any) => {
            const next = payload.new || {};
            if (next.pif_status !== "piffed") return;
            if (promptedRef.current.has(next.id)) return;
            promptedRef.current.add(next.id);

            // Look up piffer's display name for the dialog.
            let pifferName = "";
            if (next.user_id) {
              const { data: prof } = await supabase
                .from("profiles")
                .select("first_name")
                .eq("id", next.user_id)
                .maybeSingle();
              pifferName = (prof as any)?.first_name || "";
            }

            setPending({
              itemId: next.id,
              itemTitle: next.title,
              pifferName,
              pifferId: next.user_id,
            });
          },
        )
        .subscribe();
    };

    init();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id]);

  if (!pending) return null;

  return (
    <ReceiverConfirmation
      itemId={pending.itemId}
      itemTitle={pending.itemTitle}
      pifferName={pending.pifferName}
      pifferId={pending.pifferId}
      open={!!pending}
      onOpenChange={(open) => {
        if (!open) setPending(null);
      }}
      onConfirmed={() => setPending(null)}
    />
  );
}
