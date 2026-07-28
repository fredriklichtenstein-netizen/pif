
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NotificationPreferences } from "./types";
import { useTranslation } from "react-i18next";

export function useNotificationPreferences() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_messages: true,
    email_mentions: true,
    email_item_updates: true,
    email_announcements: true,
    push_messages: true,
    push_mentions: true,
    push_item_updates: true,
  });

  const fetchNotificationPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return;
      }
      
      if (userProfile?.notification_preferences) {
        const notificationPrefs = userProfile.notification_preferences as Record<string, boolean>;

        // A key absent from the stored JSON means the user has never made an
        // active choice -- treat that as "on", matching the edge function's
        // opt-out semantics (it only skips a send when a key is explicitly false).
        const withDefault = (key: keyof NotificationPreferences) =>
          notificationPrefs[key] !== false;

        const typedPreferences: NotificationPreferences = {
          email_messages: withDefault('email_messages'),
          email_mentions: withDefault('email_mentions'),
          email_item_updates: withDefault('email_item_updates'),
          email_announcements: withDefault('email_announcements'),
          push_messages: withDefault('push_messages'),
          push_mentions: withDefault('push_mentions'),
          push_item_updates: withDefault('push_item_updates'),
        };

        setPreferences(typedPreferences);
      }
    } catch (error) {
      console.error("Error in fetchNotificationPreferences:", error);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const savePreferences = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { error } = await supabase
        .from('profiles')
        .update({
          notification_preferences: preferences as any,
        })
        .eq('id', user.id);

      if (error) {
        console.error("Error updating notification preferences:", error);
        throw error;
      }

      toast({
        title: t('interactions.preferences_updated'),
        description: t('interactions.preferences_updated_description'),
      });
    } catch (error: any) {
      toast({
        title: t('post.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificationPreferences();
  }, []);

  return {
    preferences,
    loading,
    handleToggle,
    savePreferences
  };
}
