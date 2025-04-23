
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { ProfileOverview } from "@/components/profile/ProfileOverview";
import { Settings } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { AvatarImage } from "@/components/ui/optimized-image";
import { addLocationPrivacy } from "@/utils/locationPrivacy";
import { MyPifsGrid } from "@/components/profile/MyPifsGrid";
import { InterestedPifsGrid } from "@/components/profile/InterestedPifsGrid";
import { useMapbox } from "@/hooks/useMapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";

// Helper: format name as "Firstname L"
function formatPublicName(profile: any) {
  if (!profile.first_name) return "";
  const initial = profile.last_name ? profile.last_name[0].toUpperCase() : "";
  return `${profile.first_name} ${initial}`;
}

// Same coordinates parser as in post utils
function parseCoordinates(raw: any): { lng: number; lat: number } | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    const match = /\((-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)\)/.exec(raw);
    if (match) {
      return { lng: parseFloat(match[1]), lat: parseFloat(match[3]) };
    }
  }
  if (typeof raw === "object" && "coordinates" in raw) {
    return {
      lng: raw.coordinates[0],
      lat: raw.coordinates[1],
    };
  }
  return null;
}

function ProfileMap({ coordinates }: { coordinates: { lng: number; lat: number } }) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const { mapToken, isLoading: isMapTokenLoading } = useMapbox();
  
  useEffect(() => {
    if (!coordinates || !mapToken || !mapContainerRef.current) return;
    
    mapboxgl.accessToken = mapToken;
    let destroyed = false;

    const initializeMap = async () => {
      const [lng, lat] = await addLocationPrivacy(coordinates.lng, coordinates.lat);
      if (destroyed) return;
      
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

  useEffect(() => {
    if (user) {
      setProfile(user);
      // Only try to parse coordinates if clearly present in user data
      if (user?.coordinates) {
        const coord = parseCoordinates(user.coordinates);
        if (coord) setCoordinates(coord);
      }
    }
  }, [user]);

  if (authLoading) {
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

  // Main profile layout
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-2 flex flex-col items-center">
      <div className="w-full max-w-3xl mx-auto">
        {/* Public Profile Info */}
        <Card className="p-6 mb-6 flex flex-col items-center shadow rounded-xl">
          <AvatarImage
            src={profile.avatar_url || undefined}
            alt={formatPublicName(profile)}
            size={96}
            className="mb-3 border"
          />
          <div className="text-2xl font-semibold mb-1">{formatPublicName(profile)}</div>
          <div className="text-gray-600 capitalize mb-1">
            {profile.gender ? profile.gender.replace('_', ' ') : "Gender undisclosed"}
          </div>
          {/* Only owner sees address */}
          {profile.address && (
            <div className="text-sm text-gray-500 mb-2 text-center">{profile.address}</div>
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
