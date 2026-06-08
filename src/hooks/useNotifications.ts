
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { DEMO_MODE } from "@/config/demoMode";
import { MOCK_NOTIFICATIONS } from "@/data/mockNotifications";
import { maybeRecoverFromAuthError } from "@/hooks/auth/sessionRecovery";

// Cross-instance sync: when one mounted useNotifications marks read or
// receives a new notification via realtime, every other instance updates
// its local state immediately (no refetch / no loading flash).
//
// Cross-tab sync (same browser): a BroadcastChannel mirrors these events
// to every other tab on this device, so read state and counts stay aligned
// without waiting for realtime / refetch.
// Cross-device sync (different browsers/devices): handled by the per-user
// Supabase realtime subscription below — every device subscribed as the
// same user picks up INSERT/UPDATE/DELETE on `notifications`.
const NOTIF_SYNC_EVENT = "pif:notifications:read-sync";
const NOTIF_NEW_EVENT = "pif:notifications:new";
const NOTIF_BC_NAME = "pif:notifications";
type NotifSyncDetail = { ids?: string[]; all?: boolean };
type NotifBcMessage =
  | { kind: "sync"; detail: NotifSyncDetail }
  | { kind: "new"; detail: Notification };

let notifBc: BroadcastChannel | null = null;
const getNotifBc = (): BroadcastChannel | null => {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  if (!notifBc) {
    try {
      notifBc = new BroadcastChannel(NOTIF_BC_NAME);
    } catch {
      notifBc = null;
    }
  }
  return notifBc;
};

const emitNotifSync = (detail: NotifSyncDetail) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NOTIF_SYNC_EVENT, { detail }));
  try {
    getNotifBc()?.postMessage({ kind: "sync", detail } satisfies NotifBcMessage);
  } catch {
    // BroadcastChannel may fail in private mode; in-window listeners still fire.
  }
};
const emitNotifNew = (notif: Notification) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NOTIF_NEW_EVENT, { detail: notif }));
  try {
    getNotifBc()?.postMessage({ kind: "new", detail: notif } satisfies NotifBcMessage);
  } catch {
    // see above
  }
};




export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content?: string;
  reference_id?: string;
  reference_type?: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  actor_id?: string | null;
  actor_name?: string | null;
  item_id?: number | string | null;
  item_title?: string | null;
  conversation_id?: string | null;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<Error | null>(null);
  const { user } = useGlobalAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Single source of truth: unread count is always derived from
  // the notifications array so the nav-tab badge and the All/Unread
  // filter pills can never drift apart.
  const unreadCount = notifications.reduce((acc, n) => (n.is_read ? acc : acc + 1), 0);


  const fetchNotifications = useCallback(async (opts?: { silent?: boolean }) => {
    if (!user?.id) return;

    // Demo mode: use mock notifications
    if (DEMO_MODE) {
      setNotifications(MOCK_NOTIFICATIONS);
       => !n.is_read).length);
      setIsLoading(false);
      return;
    }

    if (!opts?.silent) setIsLoading(true);
    setFetchError(null);


    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      // Stale JWT after a deploy (or RLS-evicted session) lands here too —
      // trigger global session recovery instead of just toasting.
      if (maybeRecoverFromAuthError(error, "notifications fetch")) {
        setIsLoading(false);
        return;
      }
      setFetchError(error);
      toast({
        title: t('interactions.failed_load_notifications'),
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    const transformed: Notification[] = (data || []).map((n: any) => {
      const p = (n.payload && typeof n.payload === "object" ? n.payload : {}) as Record<string, any>;
      return {
        id: String(n.id),
        user_id: n.user_id,
        type: n.type,
        title: n.type,
        is_read: n.read ?? n.is_read ?? false,
        created_at: n.created_at,
        actor_id: p.actor_id ?? null,
        actor_name: p.actor_name ?? null,
        item_id: p.item_id ?? null,
        item_title: p.item_title ?? null,
        conversation_id: p.conversation_id ?? null,
        reference_id: n.reference_id ?? p.conversation_id ?? p.item_id ?? undefined,
        reference_type: n.reference_type,
        action_url: n.action_url,
      };
    });
    setNotifications(transformed);
    setIsLoading(false);

    const unread = transformed.filter((n) => !n.is_read).length;
    
  }, [user?.id, toast]);

  // Realtime notifications + recovery on focus/visibility/online + safety poll
  useEffect(() => {
    fetchNotifications();
    if (!user?.id || DEMO_MODE) return;

    const transformRow = (n: any): Notification => {
      const p = (n.payload && typeof n.payload === "object" ? n.payload : {}) as Record<string, any>;
      return {
        id: String(n.id),
        user_id: n.user_id,
        type: n.type,
        title: n.type,
        is_read: n.read ?? n.is_read ?? false,
        created_at: n.created_at,
        actor_id: p.actor_id ?? null,
        actor_name: p.actor_name ?? null,
        item_id: p.item_id ?? null,
        item_title: p.item_title ?? null,
        conversation_id: p.conversation_id ?? null,
        reference_id: n.reference_id ?? p.conversation_id ?? p.item_id ?? undefined,
        reference_type: n.reference_type,
        action_url: n.action_url,
      };
    };

    const applyNew = (notif: Notification) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notif.id)) return prev;
        return [notif, ...prev];
      });
      if (!notif.is_read)  => c + 1);
    };

    const channel = supabase
      .channel(`public:notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const notif = transformRow(payload.new);
            // Optimistically merge into this instance and broadcast to siblings
            // so every mounted hook (nav badge + notifications list) updates
            // instantly without waiting on its own realtime/refetch roundtrip.
            applyNew(notif);
            emitNotifNew(notif);
            return;
          }
          // UPDATE/DELETE: silent background refresh (no loading flash).
          fetchNotifications({ silent: true });
        }
      )
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          maybeRecoverFromAuthError(err, `notifications channel: ${status}`);
        }
      });

    // Coalesce wake-up refreshes: focus + visibilitychange + pageshow can
    // all fire in the same tick when returning to the tab. We dedupe to a
    // single fetch per ~250ms window.
    let wakeRefreshTimer: number | null = null;
    const refreshSilent = () => fetchNotifications({ silent: true });
    const scheduleWakeRefresh = () => {
      if (wakeRefreshTimer != null) return;
      wakeRefreshTimer = window.setTimeout(() => {
        wakeRefreshTimer = null;
        refreshSilent();
      }, 50);
    };
    const onFocus = () => scheduleWakeRefresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") scheduleWakeRefresh();
    };
    // pageshow fires after bfcache restore on mobile Safari / Firefox — a
    // case where neither focus nor visibilitychange always fires.
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted || document.visibilityState === "visible") scheduleWakeRefresh();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onFocus);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);
    // Safety poll. Throttled by the browser when hidden, but still fires
    // immediately on resume because the wake handlers above trigger first.
    const interval = window.setInterval(refreshSilent, 60_000);


    const onSync = (e: Event) => {
      const detail = (e as CustomEvent<NotifSyncDetail>).detail || {};
      if (detail.all) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        
        return;
      }
      const ids = new Set(detail.ids || []);
      if (ids.size === 0) return;
      let cleared = 0;
      setNotifications((prev) =>
        prev.map((n) => {
          if (ids.has(n.id) && !n.is_read) {
            cleared += 1;
            return { ...n, is_read: true };
          }
          return n;
        })
      );
      if (cleared > 0)  => Math.max(0, c - cleared));
    };
    const onNew = (e: Event) => {
      const notif = (e as CustomEvent<Notification>).detail;
      if (notif) applyNew(notif);
    };
    window.addEventListener(NOTIF_SYNC_EVENT, onSync);
    window.addEventListener(NOTIF_NEW_EVENT, onNew);

    // Cross-tab bridge: receive BroadcastChannel messages from other tabs
    // and re-dispatch as local CustomEvents (no re-broadcast, no echo).
    const bc = getNotifBc();
    const onBcMessage = (e: MessageEvent<NotifBcMessage>) => {
      const msg = e.data;
      if (!msg || typeof msg !== "object") return;
      if (msg.kind === "sync") {
        window.dispatchEvent(new CustomEvent(NOTIF_SYNC_EVENT, { detail: msg.detail }));
      } else if (msg.kind === "new") {
        window.dispatchEvent(new CustomEvent(NOTIF_NEW_EVENT, { detail: msg.detail }));
      }
    };
    bc?.addEventListener("message", onBcMessage);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onFocus);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(NOTIF_SYNC_EVENT, onSync);
      window.removeEventListener(NOTIF_NEW_EVENT, onNew);
      bc?.removeEventListener("message", onBcMessage);
      window.clearInterval(interval);
      if (wakeRefreshTimer != null) window.clearTimeout(wakeRefreshTimer);
    };


  }, [user?.id, fetchNotifications]);


  const markAllAsRead = async () => {
    if (!user?.id) return;

    // Optimistic: clear the badge immediately.
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    
    emitNotifSync({ all: true });

    if (DEMO_MODE) return;

    const { error } = await (supabase
      .from("notifications") as any)
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    if (error) {
      if (maybeRecoverFromAuthError(error, "mark_all_notifications_read")) return;
      toast({
        title: t('interactions.failed_mark_read'),
        description: error.message,
        variant: "destructive",
      });
      // Re-sync on failure so UI matches server.
      fetchNotifications();
      return;
    }
    fetchNotifications();
  };

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user?.id || !notificationId) return;

    // Optimistic update.
    let wasUnread = false;
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === notificationId) {
          if (!n.is_read) wasUnread = true;
          return { ...n, is_read: true };
        }
        return n;
      })
    );
    if (wasUnread) {
       => Math.max(0, c - 1));
      emitNotifSync({ ids: [notificationId] });
    }

    if (DEMO_MODE) return;

    const { error } = await (supabase
      .from("notifications") as any)
      .update({ read: true })
      .eq("id", notificationId)
      .eq("user_id", user.id);

    if (error) {
      if (maybeRecoverFromAuthError(error, "mark_notification_read")) return;
      // Silent: re-sync to recover UI state.
      fetchNotifications();
    }
  }, [user?.id, fetchNotifications]);

  return {
    notifications,
    isLoading,
    fetchError,
    unreadCount,
    markAllAsRead,
    markAsRead,
    fetchNotifications,
  };
}
