import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { DEMO_MODE } from "@/config/demoMode";
import { parseCoordinates } from "@/utils/post/parseCoordinates";
import { reverseGeocodeCity } from "@/utils/location/reverseGeocodeCity";

const attempted = new Set<string>();

/**
 * Once per session per user: if the user's profile has coordinates but
 * no `city` value, silently reverse-geocode and persist it.
 */
export function useCityBackfill() {
  const { user } = useGlobalAuth();

  useEffect(() => {
    if (DEMO_MODE || !user?.id) return;
    const userId = user.id;
    if (attempted.has(userId)) return;
    attempted.add(userId);

    (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("location, location_json, city")
          .eq("id", userId)
          .maybeSingle();
        if (error || !data) return;
        const existing = (data as any).city;
        if (existing && String(existing).trim()) return;
        const locSource = (data as any).location_json ?? (data as any).location;
        const coords = parseCoordinates(locSource);
        if (!coords) return;
        const city = await reverseGeocodeCity(coords.lng, coords.lat);
        if (!city) return;
        await supabase
          .from("profiles")
          .update({ city } as any)
          .eq("id", userId);
      } catch {
        /* silent — backfill is best-effort */
      }
    })();
  }, [user?.id]);
}
