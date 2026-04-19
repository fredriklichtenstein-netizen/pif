import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { parseCoordinates } from "@/utils/post/parseCoordinates";

interface PifAddressData {
  address: string | null;
  coordinates: { lat: number; lng: number } | null;
}

const pifAddressCache = new Map<string, { data: PifAddressData; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export const usePifAddress = () => {
  const { user } = useGlobalAuth();
  const [data, setData] = useState<PifAddressData>({ address: null, coordinates: null });
  const [isLoading, setIsLoading] = useState(false);

  const fetchPifAddress = useCallback(async (): Promise<PifAddressData> => {
    if (!user) return { address: null, coordinates: null };

    const cached = pifAddressCache.get(user.id);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_TTL) {
      setData(cached.data);
      return cached.data;
    }

    setIsLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("address, location")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("[usePifAddress] Error fetching profile:", error);
        return { address: null, coordinates: null };
      }

      const coords = parseCoordinates((profile as any)?.location);
      const result: PifAddressData = {
        address: profile?.address || null,
        coordinates: coords,
      };
      pifAddressCache.set(user.id, { data: result, timestamp: now });
      setData(result);
      return result;
    } catch (e) {
      console.error("[usePifAddress] Unexpected error:", e);
      return { address: null, coordinates: null };
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPifAddress();
    }
  }, [user, fetchPifAddress]);

  const clearCache = useCallback(() => {
    if (user) pifAddressCache.delete(user.id);
  }, [user]);

  return {
    address: data.address,
    coordinates: data.coordinates,
    isLoading,
    fetchPifAddress,
    clearCache,
    hasPifAddress: !!(data.address && data.coordinates),
  };
};
