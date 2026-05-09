
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { DEMO_MODE } from "@/config/demoMode";
import { MOCK_NOTIFICATIONS } from "@/data/mockNotifications";
import { maybeRecoverFromAuthError } from "@/hooks/auth/sessionRecovery";

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
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useGlobalAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    
    // Demo mode: use mock notifications
    if (DEMO_MODE) {
      setNotifications(MOCK_NOTIFICATIONS);
      setUnreadCount(MOCK_NOTIFICATIONS.filter((n) => !n.is_read).length);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
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
    setUnreadCount(unread);
  }, [user?.id, toast]);

  // Realtime notifications
  useEffect(() => {
    fetchNotifications();
    if (!user?.id || DEMO_MODE) return;

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
        () => {
          fetchNotifications();
        }
      )
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          maybeRecoverFromAuthError(err, `notifications channel: ${status}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchNotifications]);

  const markAllAsRead = async () => {
    if (!user?.id) return;
    
    // Demo mode: mark all as read locally
    if (DEMO_MODE) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      return;
    }
    
    const { error } = await (supabase.rpc as any)("mark_all_notifications_read");
    if (error) {
      toast({
        title: t('interactions.failed_mark_read'),
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    fetchNotifications();
  };

  return {
    notifications,
    isLoading,
    fetchError,
    unreadCount,
    markAllAsRead,
    fetchNotifications,
  };
}
