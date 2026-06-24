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
 * Refcounted shared realtime channel for unread-message updates.
 *
 * Supabase realtime-js dedupes channels by topic, so two components
 * calling `supabase.channel(`unread-messages:${userId}`).on(...).subscribe()`
 * independently would throw:
 *   "cannot add `postgres_changes` callbacks ... after `subscribe()`"
 *
 * We bind the three postgres_changes listeners ONCE per userId, then fan
 * events out to every registered listener. The channel is removed when
 * the last listener unregisters.
 */
type UnreadMessagesListener = { onChange: () => void };

const unreadMessagesChannels = new Map<
  string,
  { channel: ReturnType<typeof supabase.channel>; listeners: Set<UnreadMessagesListener> }
>();

function ensureUnreadMessagesChannel(userId: string, listener: UnreadMessagesListener) {
  let entry = unreadMessagesChannels.get(userId);
  if (!entry) {
    const listeners = new Set<UnreadMessagesListener>();
    const fanOut = () => {
      for (const l of listeners) {
        try {
          l.onChange();
        } catch (err) {
          console.error("[useUnreadMessagesCount] listener error", err);
        }
      }
    };
    const channel = supabase
      .channel(`unread-messages:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        fanOut
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        fanOut
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversation_participants" },
        fanOut
      )
      .subscribe();
    entry = { channel, listeners };
    unreadMessagesChannels.set(userId, entry);
  }
  entry.listeners.add(listener);
}

function releaseUnreadMessagesChannel(userId: string, listener: UnreadMessagesListener) {
  const entry = unreadMessagesChannels.get(userId);
  if (!entry) return;
  entry.listeners.delete(listener);
  if (entry.listeners.size === 0) {
    supabase.removeChannel(entry.channel);
    unreadMessagesChannels.delete(userId);
  }
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
  const [unreadByConversation, setUnreadByConversation] = useState<
    Record<string, number>
  >({});
  // Gate: the badge must NEVER show a count derived from anything other
  // than a fresh fetch of last_read_at from conversation_participants.
  const [hasFreshLastRead, setHasFreshLastRead] = useState(false);
  const conversationIdsRef = useRef<string[]>([]);
  const userIdRef = useRef<string | null>(null);

  const compute = useCallback(async () => {
    if (DEMO_MODE) {
      let count = 0;
      const map: Record<string, number> = {};
      for (const conv of MOCK_CONVERSATIONS) {
        const msgs = (MOCK_MESSAGES as any)[conv.id] || [];
        const n = msgs.filter(
          (m: any) => m.sender_id !== DEMO_USER.id && !m.read_at
        ).length;
        map[conv.id] = n;
        count += n;
      }
      setUnreadByConversation(map);
      setUnreadCount(count);
      setHasFreshLastRead(true);
      return;
    }

    if (!user?.id) {
      setUnreadCount(0);
      setUnreadByConversation({});
      setHasFreshLastRead(false);
      conversationIdsRef.current = [];
      userIdRef.current = null;
      return;
    }

    if (userIdRef.current !== user.id) {
      setHasFreshLastRead(false);
      setUnreadCount(0);
      setUnreadByConversation({});
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
        setUnreadByConversation({});
        setHasFreshLastRead(true);
        return;
      }

      // STEP 1 — fetch last_read_at FRESH from conversation_participants.
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

      // STEP 2 — fetch messages and compute.
      const { data: msgs, error: msgErr } = await supabase
        .from("messages")
        .select("conversation_id, created_at, sender_id, is_system_message, target_user_id")
        .in("conversation_id", ids as any);
      if (msgErr) throw msgErr;

      const countsByConv: Record<string, number> = {};
      for (const id of ids) countsByConv[String(id)] = 0;
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
          countsByConv[cid] = (countsByConv[cid] ?? 0) + 1;
        }
      }

      let total = 0;
      for (const cid of Object.keys(countsByConv)) total += countsByConv[cid];
      setUnreadByConversation(countsByConv);
      setUnreadCount(total);
      setHasFreshLastRead(true);
    } catch (err) {
      console.error("[useUnreadMessagesCount] compute failed", err);
    }
  }, [user?.id]);

  useEffect(() => {
    compute();
    if (DEMO_MODE || !user?.id) return;

    const listener: UnreadMessagesListener = { onChange: () => compute() };
    ensureUnreadMessagesChannel(user.id, listener);

    const onFocus = () => compute();
    const onVisibility = () => {
      if (document.visibilityState === "visible") compute();
    };
    const onConversationRead = () => compute();
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onFocus);
    window.addEventListener("pif:conversation-read", onConversationRead);
    document.addEventListener("visibilitychange", onVisibility);

    const interval = window.setInterval(compute, 60_000);

    return () => {
      releaseUnreadMessagesChannel(user.id, listener);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onFocus);
      window.removeEventListener("pif:conversation-read", onConversationRead);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
    };
  }, [user?.id, compute]);

  return {
    unreadMessagesCount: hasFreshLastRead ? unreadCount : 0,
    unreadByConversation: hasFreshLastRead ? unreadByConversation : {},
    hasFreshLastRead,
    refresh: compute,
  };
}
