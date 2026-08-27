
import { useEffect, useMemo } from 'react';
import { calculateDistance, formatDistance } from '@/utils/distance';
import { useLocationStorage } from '@/components/map/location/useLocationStorage';
import { useLiveLocationStore } from '@/stores/liveLocationStore';

interface Coordinates {
  lat: number;
  lng: number;
}

export const useDistanceCalculation = (coordinates: Coordinates | null): string => {
  const storage = useLocationStorage();
  const liveLocation = useLiveLocationStore((s) => s.location);
  const ensureFreshLocation = useLiveLocationStore((s) => s.ensureFreshLocation);

  // Self-deduplicating (see liveLocationStore) -- safe to call from every
  // card mounting this hook, only the first actually triggers a fetch.
  useEffect(() => {
    ensureFreshLocation();
  }, [ensureFreshLocation]);

  return useMemo(() => {
    // Prefer the live, permission-gated fetch (see liveLocationStore for
    // why: the stored value has no timestamp and never refreshes, so it
    // can silently go stale -- reported live as a wrong distance on one
    // device while another showed the correct one for the same post).
    const userLocation = liveLocation ?? storage.getStoredLocation();
    if (!userLocation || !coordinates) {
      return '';
    }

    const { lat, lng } = coordinates;
    
    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number' || 
        isNaN(lat) || isNaN(lng) || 
        lat === 0 || lng === 0) {
      return '';
    }

    try {
      const distance = calculateDistance(userLocation[0], userLocation[1], lng, lat);
      if (isNaN(distance) || distance < 0) {
        return '';
      }
      
      return formatDistance(distance);
    } catch (error) {
      console.error('Error calculating distance:', error);
      return '';
    }
  }, [coordinates, storage, liveLocation]);
};
