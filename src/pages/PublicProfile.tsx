import { useParams, Link } from "react-router-dom";
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

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

function formatPublicName(profile: Profile) {
  if (!profile.first_name) return "";
  const initial = profile.last_name ? profile.last_name[0].toUpperCase() : "";
  return `${profile.first_name} ${initial}`;
}

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

function UserPifsGrid({ userId }: { userId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase
        .from("items")
        .select("id,title,description,category,images,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setItems(data || []);
          setLoading(false);
        });
    });
  }, [userId]);

  if (loading) {
    return <div className="py-4 text-center text-gray-400">Loading user PIFs...</div>;
  }
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center p-4 gap-2">
        <div className="text-sm text-gray-500">No PIFs posted yet.</div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mt-4 mb-2">My PIFs</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <Link to={`/post/${item.id}`} key={item.id} aria-label={item.title}>
            <Card className="p-4 hover:ring-2 ring-primary transition flex flex-col gap-2">
              <div className="font-bold text-lg">{item.title}</div>
              <div className="text-xs text-gray-500">{item.created_at && new Date(item.created_at).toLocaleDateString()}</div>
              <div className="text-sm text-gray-700">{item.description}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
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
        <UserPifsGrid userId={profile.id} />
      </Card>
    </div>
  );
}
