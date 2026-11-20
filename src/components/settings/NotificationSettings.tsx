
import { Separator } from "@/components/ui/separator";
import { EmailNotifications } from "./EmailNotifications";
import { PushNotifications } from "./PushNotifications";
import { useNotificationPreferences } from "./useNotificationPreferences";

export function NotificationSettings() {
  const { preferences, handleToggle } = useNotificationPreferences();

  return (
    <div className="space-y-6">
      <EmailNotifications 
        preferences={preferences} 
        onToggle={handleToggle} 
      />

      <Separator />

      <PushNotifications 
        preferences={preferences} 
        onToggle={handleToggle} 
      />
    </div>
  );
}
