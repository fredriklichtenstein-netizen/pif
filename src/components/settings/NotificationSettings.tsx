
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { EmailNotifications } from "./EmailNotifications";
import { PushNotifications } from "./PushNotifications";
import { useNotificationPreferences } from "./useNotificationPreferences";
import { useTranslation } from "react-i18next";

export function NotificationSettings() {
  const { preferences, loading, handleToggle, savePreferences } = useNotificationPreferences();
  const { t } = useTranslation();

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

      <Button
        onClick={savePreferences}
        disabled={loading}
        className="w-full mt-4"
      >
        {loading ? t('common.saving') : t('settings.save_preferences')}
      </Button>
    </div>
  );
}
