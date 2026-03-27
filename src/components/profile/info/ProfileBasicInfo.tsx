
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { AvatarImage } from "@/components/ui/optimized-image";
import { ProfileLocationMap } from "../map/ProfileLocationMap";
import { useTranslation } from "react-i18next";

interface ProfileBasicInfoProps {
  avatarUrl: string | null;
  displayName: string;
  gender: string | null;
  coordinates: { lng: number; lat: number } | null;
}

export function ProfileBasicInfo({ avatarUrl, displayName, gender, coordinates }: ProfileBasicInfoProps) {
  const { t } = useTranslation();
  
  return (
    <div className="w-full flex flex-col items-center">
      <AvatarImage
        src={avatarUrl}
        alt={displayName || t('common.user')}
        size={96}
        className="mb-3 border"
      />
      <div className="text-2xl font-semibold mb-1">{displayName || t('common.user')}</div>
      <div className="text-muted-foreground capitalize mb-4">
        {gender ? gender.replace('_', ' ') : t('common.gender_undisclosed')}
      </div>
      
      {coordinates && (
        <div className="w-full max-w-md mb-6">
          <ProfileLocationMap coordinates={coordinates} />
        </div>
      )}

      <div className="flex gap-3">
        <Link to="/profile/edit">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Settings size={16} />
            {t('profile.edit_profile')}
          </Button>
        </Link>
        <Link to="/account-settings">
          <Button variant="outline" size="sm">{t('profile.account_settings')}</Button>
        </Link>
      </div>
    </div>
  );
}
