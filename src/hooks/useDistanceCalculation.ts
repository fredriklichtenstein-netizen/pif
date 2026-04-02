
import { useMemo } from 'react';
import { calculateDistance, formatDistance } from '@/utils/distance';
import { useLocationStorage } from '@/components/map/location/useLocationStorage';

interface Coordinates {
  lat: number;
  lng: number;
}

export const useDistanceCalculation = (coordinates: Coordinates | null): string => {
  const storage = useLocationStorage();
  
  return useMemo(() => {
    const userLocation = storage.getStoredLocation();
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
      const distance = calculateDistance(userLocation[1], userLocation[0], lat, lng);
      if (isNaN(distance) || distance < 0) {
        return '';
      }
      
      return formatDistance(distance);
    } catch (error) {
      console.error('Error calculating distance:', error);
      return '';
    }
  }, [coordinates, storage]);
};
