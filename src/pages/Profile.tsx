
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { MyPifsGrid } from "@/components/profile/MyPifsGrid";
import { InterestedPifsGrid } from "@/components/profile/InterestedPifsGrid";
import { supabase } from "@/integrations/supabase/client";
import { parseCoordinates } from "@/utils/post/parseCoordinates";
import { ProfileBasicInfo } from "@/components/profile/info/ProfileBasicInfo";
import { MainNav } from "@/components/MainNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArchivedPifsGrid } from "@/components/profile/ArchivedPifsGrid";
import { DEMO_MODE } from "@/config/demoMode";
import { DEMO_PROFILE } from "@/data/mockProfiles";
import { useTranslation } from "react-i18next";

function formatPublicName(profile: any) {
  if (!profile.first_name) return "";
  const initial = profile.last_name ? profile.last_name[0].toUpperCase() : "";
  return `${profile.first_name} ${initial}`;
}

const Profile = () => {
  const { user, isLoading: authLoading } = useGlobalAuth();
  const [profile, setProfile] = useState<any>(user || null);
  const [coordinates, setCoordinates] = useState<{ lng: number; lat: number } | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-pifs");
  const { t } = useTranslation();

  const fetchProfileData = async () => {
    if (!user) return;
    
    if (DEMO_MODE) {
      setProfileData(DEMO_PROFILE);
      setCoordinates({ lng: 18.0686, lat: 59.3293 });
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (error) {
        console.error("Error fetching profile data:", error);
        return;
      }
      
      setProfileData(data);
      
      if (data?.location) {
        const locationCoords = parseCoordinates(data.location);
        if (locationCoords) {
          setCoordinates(locationCoords);
        }
      } else {
        if (data?.address) {
          setCoordinates({ lat: 59.3293, lng: 18.0686 });
        }
      }
    } catch (err) {
      console.error("Error in profile data fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setProfile(user);
      fetchProfileData();
      
      const userAny = user as any;
      if (userAny && typeof userAny === 'object') {
        if ('location' in userAny && userAny.location) {
          const coord = parseCoordinates(userAny.location);
          if (coord) {
            setCoordinates(coord);
          }
        }
      }
    }
  }, [user]);

  // Prevent re-fetch on tab focus if profile data is already loaded
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && !profileData) {
        console.log('Tab visible, profile data missing — re-fetching');
        fetchProfileData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, profileData]);

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
              gender={profileData?.gender}
              coordinates={coordinates}
            />
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="my-pifs">{t('profile.my_pifs_tab')}</TabsTrigger>
              <TabsTrigger value="interested">{t('profile.interested_tab')}</TabsTrigger>
              <TabsTrigger value="archived">{t('profile.archived_tab')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="my-pifs" className="mt-0">
              <MyPifsGrid userId={profile.id} />
            </TabsContent>
            
            <TabsContent value="interested" className="mt-0">
              <InterestedPifsGrid userId={profile.id} />
            </TabsContent>
            
            <TabsContent value="archived" className="mt-0">
              <ArchivedPifsGrid userId={profile.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <MainNav />
    </>
  );
};

export default Profile;
