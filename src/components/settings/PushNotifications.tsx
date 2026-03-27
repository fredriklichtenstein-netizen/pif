
import { NotificationToggle } from "./NotificationToggle";
import { NotificationPreferences } from "./types";
import { useTranslation } from "react-i18next";

interface PushNotificationsProps {
  preferences: NotificationPreferences;
  onToggle: (key: keyof NotificationPreferences) => void;
}

export function PushNotifications({ preferences, onToggle }: PushNotificationsProps) {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{t('settings.push_notifications')}</h3>
      <div className="space-y-3">
        <NotificationToggle
          id="push_messages"
          label={t('settings.new_messages')}
          checked={preferences.push_messages}
          onToggle={() => onToggle("push_messages")}
        />
        
        <NotificationToggle
          id="push_mentions"
          label={t('settings.mentions_comments')}
          checked={preferences.push_mentions}
          onToggle={() => onToggle("push_mentions")}
        />
        
        <NotificationToggle
          id="push_item_updates"
          label={t('settings.item_status_updates')}
          checked={preferences.push_item_updates}
          onToggle={() => onToggle("push_item_updates")}
        />
      </div>
    </div>
  );
}
