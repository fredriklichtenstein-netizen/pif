
import { Card } from "@/components/ui/card";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { AvatarImage } from "@/components/ui/optimized-image";
import { useTranslation } from "react-i18next";

export function ProfileOverview({ user }: { user: any }) {
  const { t } = useTranslation();
  
  return (
    <Card className="p-6 flex flex-col items-center mb-4">
      <AvatarImage
        src={user.avatar_url}
        alt={user.first_name || user.email}
        size={96}
        className="mb-3 border"
      />
      <div className="text-2xl font-semibold">{user.first_name} {user.last_name?.[0]}</div>
      <div className="text-muted-foreground mb-2">{user.email}</div>
      <div className="flex gap-6 mt-4">
        <div className="text-center">
          <div className="font-bold text-lg">–</div>
          <div className="text-xs text-muted-foreground">{t('interactions.pifs_posted')}</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-lg">–</div>
          <div className="text-xs text-muted-foreground">{t('interactions.interests_shown')}</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-lg">–</div>
          <div className="text-xs text-muted-foreground">{t('interactions.items_received')}</div>
        </div>
      </div>
    </Card>
  );
}
