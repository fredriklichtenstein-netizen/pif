import { supabase } from "@/integrations/supabase/client";

let cachedToken: string | null = null;

async function getMapboxToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  try {
    const { data, error } = await supabase.functions.invoke("get-mapbox-token");
    if (error || !data?.token) return null;
    cachedToken = data.token as string;
    return cachedToken;
  } catch {
    return null;
  }
}

/**
 * Reverse-geocode coordinates to the most specific available place name.
 * Priority: neighborhood -> locality -> place.
 */
export async function reverseGeocodeCity(
  lng: number,
  lat: number,
): Promise<string> {
  try {
    const token = await getMapboxToken();
    if (!token) return "";
    const types = "neighborhood,locality,place";
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&types=${types}&limit=5&language=sv`;
    const res = await fetch(url);
    if (!res.ok) return "";
    const json = await res.json();
    const features: any[] = json?.features ?? [];
    const pickByType = (t: string) =>
      features.find((f) => Array.isArray(f.place_type) && f.place_type.includes(t));
    const chosen =
      pickByType("neighborhood") ?? pickByType("locality") ?? pickByType("place");
    return (chosen?.text as string) ?? "";
  } catch {
    return "";
  }
}
