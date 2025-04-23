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

  const fetchProfileData = async () => {
    if (!user) return;
    
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
      
      console.log("Fetched profile data:", data);
      setProfileData(data);
      
      if (data?.location) {
        const locationCoords = parseCoordinates(data.location);
        if (locationCoords) {
          console.log("Found coordinates in location field:", locationCoords);
          setCoordinates(locationCoords);
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
      console.log("User data:", user);
      setProfile(user);
      fetchProfileData();
      
      const userAny = user as any;
      if (userAny?.coordinates) {
        console.log("Raw coordinates:", userAny.coordinates);
        const coord = parseCoordinates(userAny.coordinates);
        if (coord) {
          console.log("Parsed coordinates:", coord);
          setCoordinates(coord);
        }
      }
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="text-gray-600">Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="flex flex-col items-center p-8 gap-4 max-w-md">
          <AlertCircle className="h-12 w-12 text-amber-500" />
          <div className="text-xl font-bold">Authentication required</div>
          <div className="text-gray-600 text-center">Please sign in to view your profile</div>
          <Link to="/auth">
            <Button>Sign In</Button>
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

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-3">My PIFs</h2>
            <MyPifsGrid userId={profile.id} />
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold mb-3">PIFs I'm Interested In</h2>
            <InterestedPifsGrid userId={profile.id} />
          </section>
        </div>
      </div>
      <MainNav />
    </>
  );
};

export default Profile;
