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
  const conversationIdsRef = useRef<string[]>([]);

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
      conversationIdsRef.current = [];
      return;
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
        return;
      }

      // Fetch this user's last_read_at per conversation FRESH from the
      // DB on every recount — never from any local cache or in-memory
      // store that would reset on refresh. mark_conversation_read
      // updates last_read_at (NOT messages.read_at), so the unread
      // count must be derived by comparing each message's created_at
      // against the participant's stored last_read_at.
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

      // Pull all messages in these conversations and filter client-side.
      // Targeted logic: regular messages from other users count, plus
      // system messages targeted at the current user or broadcast
      // (target_user_id IS NULL). System messages whose target is the
      // OTHER user (i.e. triggered by current user's action) do NOT count.
      const { data: msgs, error: msgErr } = await supabase
        .from("messages")
        .select("conversation_id, created_at, sender_id, is_system_message, target_user_id")
        .in("conversation_id", ids as any);
      if (msgErr) throw msgErr;

      let total = 0;
      const diagnostics = new Map<
        string,
        {
          rawLastRead: string | null | undefined;
          parsedLastReadMs: number;
          rawCreatedAt: string | null | undefined;
          parsedCreatedAtMs: number;
          countedAsUnread: boolean;
        }
      >();
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
        const countedAsUnread = eligible && createdMs > lastReadMs;
        if (countedAsUnread) total += 1;
        const prev = diagnostics.get(cid);
        if (
          !prev ||
          (countedAsUnread && !prev.countedAsUnread) ||
          (countedAsUnread === prev.countedAsUnread && createdMs > prev.parsedCreatedAtMs)
        ) {
          diagnostics.set(cid, {
            rawLastRead: lastRead,
            parsedLastReadMs: lastReadMs,
            rawCreatedAt: m.created_at,
            parsedCreatedAtMs: createdMs,
            countedAsUnread,
          });
        }
      }
      for (const [conversationId, entry] of diagnostics.entries()) {
        console.log("[useUnreadMessagesCount] timestamp comparison", {
          conversationId,
          rawLastReadAt: entry.rawLastRead,
          parsedLastReadAtMs: entry.parsedLastReadMs,
          rawMostRecentUnreadCreatedAt: entry.rawCreatedAt,
          parsedMostRecentUnreadCreatedAtMs: entry.parsedCreatedAtMs,
          countedAsUnread: entry.countedAsUnread,
        });
      }
      setUnreadCount(total);
    } catch {
      // Fail silently — badge just won't update.
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
        (payload) => {
          const row: any = payload.new;
          // Fast path: bump count immediately for known conversations
          // so the badge updates without waiting for the recount roundtrip.
          if (
            row &&
            row.sender_id !== user.id &&
            !row.is_system_message &&
            conversationIdsRef.current.includes(String(row.conversation_id))
          ) {
            setUnreadCount((c) => c + 1);
          }
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

  return { unreadMessagesCount: unreadCount, refresh: compute };
}
