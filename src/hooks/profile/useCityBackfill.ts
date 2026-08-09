import { useEffect } from "react";
import { fetchMyProfile } from "@/services/profile/myProfile";
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
        // Backfills the caller's OWN city from their own coordinates, so this
        // goes through the RPC — location_json is not table-readable any more.
        const { data, error } = await fetchMyProfile();
        if (error || !data) return;
        const existing = (data as any).city;
        if (existing && String(existing).trim()) return;
        const coords = parseCoordinates((data as any).location_json);
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
