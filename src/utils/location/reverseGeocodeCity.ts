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
 * Normalise input into { lng, lat } numbers.
 * Accepts:
 *   - two numeric args (lng, lat)
 *   - a PostGIS "(lng,lat)" or "POINT(lng lat)" string
 *   - an object { lng, lat } or { x, y }
 *   - an array [lng, lat]
 */
function normalise(
  lngOrInput: number | string | any,
  maybeLat?: number,
): { lng: number; lat: number } | null {
  // Two numeric args
  if (typeof lngOrInput === "number" && typeof maybeLat === "number") {
    return { lng: lngOrInput, lat: maybeLat };
  }

  // String: PostGIS "(lng,lat)" or "POINT(lng lat)"
  if (typeof lngOrInput === "string") {
    const s = lngOrInput.trim();
    const simple = s.match(/\(?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)?/);
    const point = s.match(/POINT\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)/i);
    const m = point ?? simple;
    if (m) {
      const lng = parseFloat(m[1]);
      const lat = parseFloat(m[2]);
      if (Number.isFinite(lng) && Number.isFinite(lat)) return { lng, lat };
    }
    return null;
  }

  if (Array.isArray(lngOrInput) && lngOrInput.length >= 2) {
    const lng = Number(lngOrInput[0]);
    const lat = Number(lngOrInput[1]);
    if (Number.isFinite(lng) && Number.isFinite(lat)) return { lng, lat };
  }

  if (lngOrInput && typeof lngOrInput === "object") {
    const lng = Number((lngOrInput as any).lng ?? (lngOrInput as any).x);
    const lat = Number((lngOrInput as any).lat ?? (lngOrInput as any).y);
    if (Number.isFinite(lng) && Number.isFinite(lat)) return { lng, lat };
  }

  return null;
}

/**
 * Reverse-geocode coordinates to the most specific available place name.
 * Priority: neighborhood -> locality -> place.
 */
export async function reverseGeocodeCity(
  lngOrInput: number | string | any,
  maybeLat?: number,
): Promise<string> {
  try {
    const coords = normalise(lngOrInput, maybeLat);
    if (!coords) return "";
    const { lng, lat } = coords;
    if (
      !Number.isFinite(lng) ||
      !Number.isFinite(lat) ||
      lng < -180 ||
      lng > 180 ||
      lat < -90 ||
      lat > 90
    ) {
      return "";
    }

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
