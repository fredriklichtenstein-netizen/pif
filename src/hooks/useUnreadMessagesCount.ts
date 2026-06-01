import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { DEMO_MODE } from "@/config/demoMode";
import { MOCK_MESSAGES, MOCK_CONVERSATIONS } from "@/data/mockConversations";
import { DEMO_USER } from "@/data/mockUser";

/**
 * Counts unread messages addressed to the current user
 * across all conversations they participate in.
 */
export function useUnreadMessagesCount() {
  const { user } = useGlobalAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const compute = useCallback(async () => {
    if (DEMO_MODE) {
      let count = 0;
      for (const conv of MOCK_CONVERSATIONS) {
        const msgs = (MOCK_MESSAGES as any)[conv.id] || [];
        count += msgs.filter(
          (m: any) => m.sender_id !== DEMO_USER.id && !m.read_at
        ).length;
      }
      setUnreadCount(count);
      return;
    }

    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    try {
      const { data: conversationIds, error: idsError } = await supabase.rpc(
        "get_user_conversation_ids"
      );
      if (idsError) throw idsError;
      if (!conversationIds || conversationIds.length === 0) {
        setUnreadCount(0);
        return;
      }

      const { count, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", conversationIds as any)
        .neq("sender_id", user.id)
        .is("read_at", null);

      if (error) throw error;
      setUnreadCount(count ?? 0);
    } catch {
      // Fail silently — badge just won't update.
    }
  }, [user?.id]);

  useEffect(() => {
    compute();
    if (DEMO_MODE || !user?.id) return;

    const channel = supabase
      .channel(`unread-messages:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => compute()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversation_participants" },
        () => compute()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, compute]);

  return { unreadMessagesCount: unreadCount, refresh: compute };
}
