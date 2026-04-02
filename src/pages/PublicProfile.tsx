import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { AvatarImage } from "@/components/ui/optimized-image";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { addLocationPrivacy } from "@/utils/locationPrivacy";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useTranslation } from "react-i18next";
import { MainNav } from "@/components/MainNav";

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
    return { lng: raw.coordinates[0], lat: raw.coordinates[1] };
  }
  if (typeof raw === "object" && "x" in raw && "y" in raw) {
    return { lng: raw.x, lat: raw.y };
  }
  return null;
}

function ProfileMap({ coordinates }: { coordinates: { lng: number; lat: number } }) {
  useEffect(() => {
    if (!MAPBOX_TOKEN) return;
    let mapInstance: mapboxgl.Map | null = null;
    
    addLocationPrivacy(coordinates.lng, coordinates.lat).then(([privLng, privLat]) => {
      mapInstance = new mapboxgl.Map({
        container: "public-profile-map",
        style: "mapbox://styles/mapbox/streets-v12",
        center: [privLng, privLat],
        zoom: 12,
        accessToken: MAPBOX_TOKEN,
        interactive: false,
      });
      new mapboxgl.Marker().setLngLat([privLng, privLat]).addTo(mapInstance);
    });
    
    return () => { mapInstance?.remove(); };
  }, [coordinates]);

  return <div id="public-profile-map" className="w-full h-[250px] rounded-lg mt-4" />;
}

function UserPifsGrid({ userId }: { userId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase
        .from("items")
        .select("id, title, description, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setItems(data || []);
          setLoading(false);
        });
    });
  }, [userId]);

  if (loading) {
    return <div className="py-4 text-center text-muted-foreground">{t('profile.loading_user_pifs')}</div>;
  }
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center p-4 gap-2">
        <div className="text-sm text-muted-foreground">{t('profile.no_pifs_posted')}</div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mt-4 mb-2">{t('profile.my_pifs')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <Link to={`/post/${item.id}`} key={item.id} aria-label={item.title}>
            <Card className="p-4 hover:ring-2 ring-primary transition flex flex-col gap-2">
              <div className="font-bold text-lg">{item.title}</div>
              <div className="text-xs text-muted-foreground">{item.created_at && new Date(item.created_at).toLocaleDateString()}</div>
              <div className="text-sm text-foreground/70">{item.description}</div>
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
  const { t } = useTranslation();

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-destructive">
        {t('profile.profile_not_found')}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center py-8 px-2 min-h-[70vh] pb-24">
        <Card className="p-6 rounded-xl shadow max-w-lg w-full">
          <div className="flex flex-col items-center">
            <AvatarImage
              src={profile.avatar_url || undefined}
              alt={formatPublicName(profile)}
              size={96}
              className="mb-3 border"
            />
            <div className="text-xl font-semibold">{formatPublicName(profile)}</div>
            <div className="text-muted-foreground mb-2 capitalize">{profile.gender || t('common.gender_undisclosed')}</div>
            {coordinates && (
              <div className="w-full">
                <ProfileMap coordinates={coordinates} />
              </div>
            )}
            {!coordinates && (
              <div className="w-full text-center text-xs text-muted-foreground mt-6">
                {t('common.no_location_available')}
              </div>
            )}
          </div>
          <UserPifsGrid userId={profile.id} />
        </Card>
      </div>
      <MainNav />
    </>
  );
}
