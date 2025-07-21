
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
    
    console.log('Distance calculation - userLocation:', userLocation, 'coordinates:', coordinates);
    
    if (!userLocation || !coordinates) {
      console.log('Missing data for distance calculation');
      return '';
    }

    const { lat, lng } = coordinates;
    
    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number' || 
        isNaN(lat) || isNaN(lng) || 
        lat === 0 || lng === 0) {
      console.log('Invalid coordinates for distance calculation:', { lat, lng });
      return '';
    }

    try {
      const distance = calculateDistance(userLocation[1], userLocation[0], lat, lng);
      console.log('Calculated distance:', distance, 'km');
      
      if (isNaN(distance) || distance < 0) {
        console.log('Invalid distance result:', distance);
        return '';
      }
      
      return formatDistance(distance);
    } catch (error) {
      console.error('Error calculating distance:', error);
      return '';
    }
  }, [coordinates, storage]);
};
