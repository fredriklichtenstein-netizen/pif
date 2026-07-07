
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { parseCoordinates } from "@/utils/post/parseCoordinates";
import { ProfileBasicInfo } from "@/components/profile/info/ProfileBasicInfo";
import { MainNav } from "@/components/MainNav";
import { DEMO_MODE } from "@/config/demoMode";
import { DEMO_PROFILE } from "@/data/mockProfiles";
import { useTranslation } from "react-i18next";
import { useCachedProfile } from "@/hooks/profile/useCachedProfile";

function formatPublicName(profile: any) {
  if (!profile.first_name) return "";
  const initial = profile.last_name ? profile.last_name[0].toUpperCase() : "";
  return `${profile.first_name} ${initial}`;
}

const Profile = () => {
  const { user, isLoading: authLoading } = useGlobalAuth();
  const { t } = useTranslation();

  const { profile: liveProfile, isLoading: profileLoading } = useCachedProfile(user?.id);
  const profileData = DEMO_MODE ? DEMO_PROFILE : liveProfile;
  const profile = profileData || user || null;

  const coordinates = (() => {
    if (DEMO_MODE) return { lng: 18.0686, lat: 59.3293 };
    if ((profileData as any)?.location_json) {
      const c = parseCoordinates((profileData as any).location_json);
      if (c) return c;
    }
    if (profileData?.address) return { lat: 59.3293, lng: 18.0686 };
    return null;
  })();

  const loading = !DEMO_MODE && profileLoading && !profileData;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="text-muted-foreground">{t('profile.loading')}</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="flex flex-col items-center p-8 gap-4 max-w-md">
          <AlertCircle className="h-12 w-12 text-amber-500" />
          <div className="text-xl font-bold">{t('profile.auth_required')}</div>
          <div className="text-muted-foreground text-center">{t('profile.sign_in_to_view')}</div>
          <Link to="/auth">
            <Button>{t('profile.sign_in')}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const currentAvatarUrl = profileData?.avatar_url || null;
  const displayName = formatPublicName(profileData || profile);

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8 px-2 flex flex-col items-center pb-20">
        <div className="w-full max-w-3xl mx-auto">
          <Card className="p-6 mb-6 flex flex-col items-center shadow rounded-xl">
            <ProfileBasicInfo
              avatarUrl={currentAvatarUrl}
              displayName={displayName}
              coordinates={coordinates}
            />
          </Card>
        </div>
      </div>
      <MainNav />
    </>
  );
};

export default Profile;
