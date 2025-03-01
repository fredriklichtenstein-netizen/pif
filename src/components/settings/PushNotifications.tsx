
import { NotificationToggle } from "./NotificationToggle";
import { NotificationPreferences } from "./types";

interface PushNotificationsProps {
  preferences: NotificationPreferences;
  onToggle: (key: keyof NotificationPreferences) => void;
}

export function PushNotifications({ preferences, onToggle }: PushNotificationsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Push Notifications</h3>
      <div className="space-y-3">
        <NotificationToggle
          id="push_messages"
          label="New messages"
          checked={preferences.push_messages}
          onToggle={() => onToggle("push_messages")}
        />
        
        <NotificationToggle
          id="push_mentions"
          label="Mentions and comments"
          checked={preferences.push_mentions}
          onToggle={() => onToggle("push_mentions")}
        />
        
        <NotificationToggle
          id="push_item_updates"
          label="Item status updates"
          checked={preferences.push_item_updates}
          onToggle={() => onToggle("push_item_updates")}
        />
      </div>
    </div>
  );
}
