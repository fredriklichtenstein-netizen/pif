
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
      
      // Process coordinates with more detailed logging
      if (data?.location) {
        console.log("Raw location data from profile:", data.location);
        const locationCoords = parseCoordinates(data.location);
        if (locationCoords) {
          console.log("Successfully parsed coordinates from location:", locationCoords);
          setCoordinates(locationCoords);
        } else {
          console.log("Failed to parse coordinates from location field");
        }
      } else {
        console.log("No location data found in profile");
        
        // Fallback to Stockholm coordinates if no location data available
        if (data?.address) {
          console.log("No coordinates found, but address exists:", data.address);
          setCoordinates({ lat: 59.3293, lng: 18.0686 });
          console.log("Using fallback coordinates for Stockholm:", { lat: 59.3293, lng: 18.0686 });
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
      
      // Type-safe approach - access user as any to check if it might have coordinates
      const userAny = user as any;
      if (userAny && typeof userAny === 'object') {
        if ('location' in userAny && userAny.location) {
          console.log("Raw location from user object:", userAny.location);
          const coord = parseCoordinates(userAny.location);
          if (coord) {
            console.log("Parsed coordinates from user location:", coord);
            setCoordinates(coord);
          }
        }
      }
    }
  }, [user]);

  // Add effect to log coordinates state changes
  useEffect(() => {
    console.log("Coordinates state updated:", coordinates);
  }, [coordinates]);

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

  console.log("Rendering ProfileBasicInfo with coordinates:", coordinates);

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
              <TabsTrigger value="my-pifs">My PIFs</TabsTrigger>
              <TabsTrigger value="interested">Interested</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
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
