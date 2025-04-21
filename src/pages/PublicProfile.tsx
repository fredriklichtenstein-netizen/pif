
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { AvatarImage } from "@/components/ui/optimized-image";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { addLocationPrivacy } from "@/utils/locationPrivacy";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
  gender?: string | null;
  address?: string | null;
  coordinates?: any;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ""; // CHANGE TO SUPABASE SECRET FETCH IF NEEDED

// Helper: format name as "Firstname L"
function formatPublicName(profile: Profile) {
  if (!profile.first_name) return "";
  const initial = profile.last_name ? profile.last_name[0].toUpperCase() : "";
  return `${profile.first_name} ${initial}`;
}

// Fetch profile from Supabase by id
async function fetchProfile(userId: string): Promise<Profile | null> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) {
    console.error("Profile fetch error:", error);
    return null;
  }
  return data as Profile;
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
  const mapRef = useState<HTMLDivElement | null>(null)[0];
  useEffect(() => {
    if (!coordinates || !MAPBOX_TOKEN) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    let map: mapboxgl.Map;
    let marker: mapboxgl.Marker | null = null;
    let destroyed = false;

    // Distort location for privacy
    (async () => {
      const [lng, lat] = await addLocationPrivacy(coordinates.lng, coordinates.lat);
      if (destroyed) return;
      map = new mapboxgl.Map({
        container: "public-profile-map",
        style: "mapbox://styles/mapbox/streets-v12",
        center: [lng, lat],
        zoom: 14,
        interactive: false,
        accessToken: MAPBOX_TOKEN,
      });
      marker = new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map);
    })();

    return () => {
      destroyed = true;
      if (marker) marker.remove();
      if (map) map.remove();
    };
  }, [coordinates]);
  return (
    <div
      ref={mapRef as any}
      id="public-profile-map"
      className="w-full h-[250px] rounded-lg border"
    />
  );
}

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [coordinates, setCoordinates] = useState<{ lng: number; lat: number } | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchProfile(id).then((p) => {
      setProfile(p);
      setLoading(false);
      const coord = parseCoordinates(p?.coordinates);
      if (coord) setCoordinates(coord);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Skeleton className="w-24 h-24 rounded-full mb-4" />
        <Skeleton className="h-4 w-40 mb-1" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="w-full h-[250px] rounded-lg mt-4" />
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-red-500">
        Profile not found
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 px-2 min-h-[70vh]">
      <Card className="p-6 rounded-xl shadow max-w-lg w-full">
        <div className="flex flex-col items-center">
          <AvatarImage
            src={profile.avatar_url || undefined}
            alt={formatPublicName(profile)}
            size={96}
            className="mb-3 border"
          />
          <div className="text-xl font-semibold">{formatPublicName(profile)}</div>
          <div className="text-gray-600 mb-2 capitalize">{profile.gender || "Gender undisclosed"}</div>
          {profile.address && (
            <div className="text-sm text-gray-500 mb-3 text-center">
              {profile.address}
            </div>
          )}
          {coordinates && (
            <div className="w-full">
              <ProfileMap coordinates={coordinates} />
            </div>
          )}
          {!coordinates && (
            <div className="w-full text-center text-xs text-gray-400 mt-6">
              No PIF location available.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
