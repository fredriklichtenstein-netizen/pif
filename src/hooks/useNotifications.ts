
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { DEMO_MODE } from "@/config/demoMode";
import { MOCK_NOTIFICATIONS } from "@/data/mockNotifications";

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
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<Error | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useGlobalAuth();
  const { toast } = useToast();

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
      setFetchError(error);
      toast({
        title: "Failed to load notifications",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    const transformed: Notification[] = (data || []).map((n: any) => ({
      id: String(n.id),
      user_id: n.user_id,
      type: n.type,
      title: n.type,
      is_read: n.read ?? false,
      created_at: n.created_at,
      content: typeof n.payload === 'object' ? JSON.stringify(n.payload) : undefined,
    }));
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
      .subscribe();

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
        title: "Failed to mark notifications as read",
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
