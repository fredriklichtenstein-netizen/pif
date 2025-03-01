
import { NotificationToggle } from "./NotificationToggle";
import { NotificationPreferences } from "./types";

interface EmailNotificationsProps {
  preferences: NotificationPreferences;
  onToggle: (key: keyof NotificationPreferences) => void;
}

export function EmailNotifications({ preferences, onToggle }: EmailNotificationsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Email Notifications</h3>
      <div className="space-y-3">
        <NotificationToggle
          id="email_messages"
          label="New messages"
          checked={preferences.email_messages}
          onToggle={() => onToggle("email_messages")}
        />
        
        <NotificationToggle
          id="email_mentions"
          label="Mentions and comments"
          checked={preferences.email_mentions}
          onToggle={() => onToggle("email_mentions")}
        />
        
        <NotificationToggle
          id="email_item_updates"
          label="Item status updates"
          checked={preferences.email_item_updates}
          onToggle={() => onToggle("email_item_updates")}
        />
      </div>
    </div>
  );
}
