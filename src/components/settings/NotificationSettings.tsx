
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NotificationPreferences {
  email_messages: boolean;
  email_mentions: boolean;
  email_item_updates: boolean;
  push_messages: boolean;
  push_mentions: boolean;
  push_item_updates: boolean;
}

export function NotificationSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_messages: true,
    email_mentions: true,
    email_item_updates: true,
    push_messages: true,
    push_mentions: true,
    push_item_updates: true,
  });

  useEffect(() => {
    const fetchNotificationPreferences = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('notification_preferences')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        if (data?.notification_preferences) {
          setPreferences(data.notification_preferences);
        }
      } catch (error) {
        console.error("Error fetching notification preferences:", error);
      }
    };

    fetchNotificationPreferences();
  }, []);

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
          notification_preferences: preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Email Notifications</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="email_messages" className="flex-grow">
              New messages
            </Label>
            <Switch 
              id="email_messages"
              checked={preferences.email_messages}
              onCheckedChange={() => handleToggle("email_messages")}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="email_mentions" className="flex-grow">
              Mentions and comments
            </Label>
            <Switch 
              id="email_mentions"
              checked={preferences.email_mentions}
              onCheckedChange={() => handleToggle("email_mentions")}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="email_item_updates" className="flex-grow">
              Item status updates
            </Label>
            <Switch 
              id="email_item_updates"
              checked={preferences.email_item_updates}
              onCheckedChange={() => handleToggle("email_item_updates")}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Push Notifications</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="push_messages" className="flex-grow">
              New messages
            </Label>
            <Switch 
              id="push_messages"
              checked={preferences.push_messages}
              onCheckedChange={() => handleToggle("push_messages")}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="push_mentions" className="flex-grow">
              Mentions and comments
            </Label>
            <Switch 
              id="push_mentions"
              checked={preferences.push_mentions}
              onCheckedChange={() => handleToggle("push_mentions")}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="push_item_updates" className="flex-grow">
              Item status updates
            </Label>
            <Switch 
              id="push_item_updates"
              checked={preferences.push_item_updates}
              onCheckedChange={() => handleToggle("push_item_updates")}
            />
          </div>
        </div>
      </div>

      <Button
        onClick={savePreferences}
        disabled={loading}
        className="w-full"
      >
        {loading ? "Saving..." : "Save Preferences"}
      </Button>
    </div>
  );
}
