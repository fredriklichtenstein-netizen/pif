
import { NotificationToggle } from "./NotificationToggle";
import { NotificationPreferences } from "./types";
import { useTranslation } from "react-i18next";

interface EmailNotificationsProps {
  preferences: NotificationPreferences;
  onToggle: (key: keyof NotificationPreferences) => void;
}

export function EmailNotifications({ preferences, onToggle }: EmailNotificationsProps) {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{t('settings.email_notifications')}</h3>
      <div className="space-y-3">
        <NotificationToggle
          id="email_messages"
          label={t('settings.new_messages')}
          checked={preferences.email_messages}
          onToggle={() => onToggle("email_messages")}
        />
        
        <NotificationToggle
          id="email_mentions"
          label={t('settings.mentions_comments')}
          checked={preferences.email_mentions}
          onToggle={() => onToggle("email_mentions")}
        />
        
        <NotificationToggle
          id="email_item_updates"
          label={t('settings.item_status_updates')}
          checked={preferences.email_item_updates}
          onToggle={() => onToggle("email_item_updates")}
        />
      </div>
    </div>
  );
}
