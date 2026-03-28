
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
        
        const typedPreferences: NotificationPreferences = {
          email_messages: Boolean(notificationPrefs.email_messages),
          email_mentions: Boolean(notificationPrefs.email_mentions),
          email_item_updates: Boolean(notificationPrefs.email_item_updates),
          push_messages: Boolean(notificationPrefs.push_messages),
          push_mentions: Boolean(notificationPrefs.push_mentions),
          push_item_updates: Boolean(notificationPrefs.push_item_updates),
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
          updated_at: new Date().toISOString()
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
