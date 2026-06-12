import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { DEMO_MODE } from "@/config/demoMode";
import { MOCK_MESSAGES, MOCK_CONVERSATIONS } from "@/data/mockConversations";
import { DEMO_USER } from "@/data/mockUser";

/**
 * Parse a Postgres timestamp via the JS Date constructor. Supabase JS
 * returns proper ISO 8601 strings with an explicit offset for `timestamp
 * with time zone` columns; the Date constructor handles them unambiguously
 * across browsers. No custom string normalisation — relying on the spec
 * avoids drift on older rows that previously surfaced as phantom unread.
 */
function tsMs(value: string | null | undefined): number {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

/**
 * Counts unread messages addressed to the current user
 * across all conversations they participate in.
 *
 * Updates in realtime via:
 *   - postgres_changes on `messages` and `conversation_participants`
 *   - window focus / visibility / online events (recovery)
 *   - a low-frequency safety poll
 */
export function useUnreadMessagesCount() {
  const { user } = useGlobalAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  // Gate: the badge must NEVER show a count derived from anything other
  // than a fresh fetch of last_read_at from conversation_participants.
  // Until the first compute() resolves for the current user we keep the
  // badge at 0 instead of showing a stale value from any prior render.
  const [hasFreshLastRead, setHasFreshLastRead] = useState(false);
  const conversationIdsRef = useRef<string[]>([]);
  const userIdRef = useRef<string | null>(null);

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
      setHasFreshLastRead(false);
      conversationIdsRef.current = [];
      userIdRef.current = null;
      return;
    }

    // If the auth user changed since last compute, hide any prior count
    // until the fresh last_read_at fetch for this user completes.
    if (userIdRef.current !== user.id) {
      setHasFreshLastRead(false);
      setUnreadCount(0);
      userIdRef.current = user.id;
    }

    try {
      const { data: conversationIds, error: idsError } = await supabase.rpc(
        "get_user_conversation_ids"
      );
      if (idsError) throw idsError;
      const ids = (conversationIds as any as string[]) ?? [];
      conversationIdsRef.current = ids;
      if (ids.length === 0) {
        setUnreadCount(0);
        setHasFreshLastRead(true);
        return;
      }

      // STEP 1 — fetch last_read_at FRESH from conversation_participants.
      // The unread count must NEVER be derived from a cached or empty
      // last_read_at map. Only after this fetch resolves successfully do
      // we proceed to count messages and update the badge.
      const { data: myParticipantRows, error: partErr } = await supabase
        .from("conversation_participants")
        .select("conversation_id, last_read_at")
        .eq("user_id", user.id)
        .in("conversation_id", ids as any);
      if (partErr) throw partErr;
      const lastReadByConv = new Map<string, string | null>();
      for (const row of (myParticipantRows || []) as any[]) {
        lastReadByConv.set(String(row.conversation_id), row.last_read_at ?? null);
      }

      // STEP 2 — only now fetch messages and compute. If STEP 1 above
      // threw, we fall through to the catch and leave hasFreshLastRead
      // = false so the badge stays at 0 rather than showing a stale count.
      const { data: msgs, error: msgErr } = await supabase
        .from("messages")
        .select("conversation_id, created_at, sender_id, is_system_message, target_user_id")
        .in("conversation_id", ids as any);
      if (msgErr) throw msgErr;

      const unreadByConv = new Map<string, any[]>();
      for (const m of (msgs || []) as any[]) {
        const cid = String(m.conversation_id);
        const lastRead = lastReadByConv.get(cid);
        const lastReadMs = lastRead == null ? 0 : tsMs(lastRead);
        const createdMs = tsMs(m.created_at);
        const isSystem = !!m.is_system_message;
        const target = m.target_user_id ?? null;
        const eligible = isSystem
          ? target === user.id || target === null
          : m.sender_id !== user.id;
        if (eligible && createdMs > lastReadMs) {
          const list = unreadByConv.get(cid) ?? [];
          list.push(m);
          unreadByConv.set(cid, list);
        }
      }

      let total = 0;
      for (const [cid, list] of unreadByConv.entries()) {
        total += list.length;
        console.log("[useUnreadMessagesCount] conv unread breakdown", {
          conversationId: cid,
          rawLastReadAt: lastReadByConv.get(cid) ?? null,
          unreadCount: list.length,
          unreadMessages: list.map((m: any) => ({
            created_at: m.created_at,
            sender_id: m.sender_id,
            is_system_message: !!m.is_system_message,
            target_user_id: m.target_user_id ?? null,
          })),
        });
      }
      console.log("[useUnreadMessagesCount] fresh total", { total });
      setUnreadCount(total);
      setHasFreshLastRead(true);
    } catch (err) {
      // Leave hasFreshLastRead untouched on failure so the badge does
      // not transition from 0 → stale on a partial fetch.
      console.error("[useUnreadMessagesCount] compute failed", err);
    }
  }, [user?.id]);



  useEffect(() => {
    compute();
    if (DEMO_MODE || !user?.id) return;

    // Realtime: any change to messages or participants triggers a recount.
    // We don't filter by conversation_id because the user may be added to
    // a new conversation at any time (e.g. selected as receiver).
    const channel = supabase
      .channel(`unread-messages:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          // Always recompute from scratch — never increment a stored
          // total here, or counts drift upward across realtime events.
          compute();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        () => compute()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversation_participants" },
        () => compute()
      )
      .subscribe();

    const onFocus = () => compute();
    const onVisibility = () => {
      if (document.visibilityState === "visible") compute();
    };
    const onConversationRead = () => compute();
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onFocus);
    window.addEventListener("pif:conversation-read", onConversationRead);
    document.addEventListener("visibilitychange", onVisibility);


    // Safety poll every 60s in case realtime drops.
    const interval = window.setInterval(compute, 60_000);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onFocus);
      window.removeEventListener("pif:conversation-read", onConversationRead);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
    };

  }, [user?.id, compute]);

  // Until the first fresh last_read_at fetch completes for this user,
  // expose 0 so the badge never flashes a stale value on page load.
  return {
    unreadMessagesCount: hasFreshLastRead ? unreadCount : 0,
    refresh: compute,
  };

}
