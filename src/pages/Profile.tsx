
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { ProfileOverview } from "@/components/profile/ProfileOverview";
import { Settings, AlertCircle } from "lucide-react";
import { AvatarImage } from "@/components/ui/optimized-image";
import { addLocationPrivacy } from "@/utils/locationPrivacy";
import { MyPifsGrid } from "@/components/profile/MyPifsGrid";
import { InterestedPifsGrid } from "@/components/profile/InterestedPifsGrid";
import { useMapbox } from "@/hooks/useMapbox";
import { supabase } from "@/integrations/supabase/client";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";
import { parseCoordinates } from "@/utils/post/parseCoordinates";

// Helper: format name as "Firstname L"
function formatPublicName(profile: any) {
  if (!profile.first_name) return "";
  const initial = profile.last_name ? profile.last_name[0].toUpperCase() : "";
  return `${profile.first_name} ${initial}`;
}

function ProfileMap({ coordinates }: { coordinates: { lng: number; lat: number } }) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const { mapToken, isLoading: isMapTokenLoading } = useMapbox();
  
  useEffect(() => {
    if (!coordinates || !mapToken || !mapContainerRef.current) return;
    
    console.log("Initializing map with coordinates:", coordinates);
    mapboxgl.accessToken = mapToken;
    let destroyed = false;

    const initializeMap = async () => {
      try {
        const [lng, lat] = await addLocationPrivacy(coordinates.lng, coordinates.lat);
        if (destroyed) return;
        
        console.log("Privacy-adjusted coordinates:", lng, lat);
        
        // Create map instance
        const map = new mapboxgl.Map({
          container: mapContainerRef.current!,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [lng, lat],
          zoom: 14,
          interactive: false,
        });
        
        // Add marker
        const marker = new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map);
        
        // Store references
        mapRef.current = map;
        markerRef.current = marker;
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };

    initializeMap();

    return () => {
      destroyed = true;
      if (markerRef.current) markerRef.current.remove();
      if (mapRef.current) mapRef.current.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [coordinates, mapToken]);
  
  if (isMapTokenLoading) {
    return <div className="w-full h-[200px] rounded-lg border mb-4 bg-gray-100 flex items-center justify-center">
      <div className="text-sm text-gray-500">Loading map...</div>
    </div>;
  }
  
  return <div ref={mapContainerRef} id="profile-map" className="w-full h-[200px] rounded-lg border mb-4" />;
}

const Profile = () => {
  const { user, isLoading: authLoading } = useGlobalAuth();
  const [profile, setProfile] = useState<any>(user || null);
  const [coordinates, setCoordinates] = useState<{ lng: number; lat: number } | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile data including avatar_url
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
      
      // Set coordinates if available in the location field or coordinates column
      if (data?.location) {
        // Try to parse location as coordinates
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
      
      // Only try to parse coordinates if clearly present in user data
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

  // Determine the current avatar URL to use
  const currentAvatarUrl = profileData?.avatar_url || null;
  const displayName = formatPublicName(profileData || profile);

  // Main profile layout
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-2 flex flex-col items-center">
      <div className="w-full max-w-3xl mx-auto">
        {/* Public Profile Info */}
        <Card className="p-6 mb-6 flex flex-col items-center shadow rounded-xl">
          <AvatarImage
            src={currentAvatarUrl}
            alt={displayName || "User"}
            size={96}
            className="mb-3 border"
          />
          <div className="text-2xl font-semibold mb-1">{displayName || "User"}</div>
          <div className="text-gray-600 capitalize mb-1">
            {profileData?.gender ? profileData.gender.replace('_', ' ') : "Gender undisclosed"}
          </div>
          {/* Only owner sees address */}
          {profileData?.address && (
            <div className="text-sm text-gray-500 mb-2 text-center">{profileData.address}</div>
          )}
          {!!coordinates && (
            <div className="w-full mb-2">
              <ProfileMap coordinates={coordinates} />
            </div>
          )}
          <div className="flex gap-3 mt-2">
            <Link to="/profile/edit">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Settings size={16} />
                Edit Profile
              </Button>
            </Link>
            <Link to="/account-settings">
              <Button variant="outline" size="sm">Account Settings</Button>
            </Link>
          </div>
        </Card>

        {/* My PIFs Section */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">My PIFs</h2>
          <MyPifsGrid userId={profile.id} />
        </section>

        {/* PIFs I'm Interested In Section */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-3">PIFs I'm Interested In</h2>
          <InterestedPifsGrid userId={profile.id} />
        </section>
      </div>
    </div>
  );
};

export default Profile;
