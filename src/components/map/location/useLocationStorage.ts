
interface LocationStorage {
  getStoredLocation: () => [number, number] | null;
  setStoredLocation: (location: [number, number] | null) => void;
  getStoredTrackingState: () => boolean;
  setStoredTrackingState: (isTracking: boolean) => void;
  clearStoredData: () => void;
}

export const useLocationStorage = (): LocationStorage => {
  const LOCATION_KEY = 'pif_user_location';
  const TRACKING_KEY = 'pif_location_tracking';

  const getStoredLocation = (): [number, number] | null => {
    try {
      const stored = localStorage.getItem(LOCATION_KEY);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length === 2 && 
          typeof parsed[0] === 'number' && typeof parsed[1] === 'number') {
        // Ensure coordinates are in [lng, lat] format for Mapbox compatibility
        const [lng, lat] = parsed;
        
        // Validate coordinate ranges
        if (lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
          return [lng, lat];
        } else {
          console.warn('Invalid coordinate ranges:', { lng, lat });
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error('Error retrieving stored location:', error);
      return null;
    }
  };

  const setStoredLocation = (location: [number, number] | null): void => {
    try {
      if (location) {
        const [lng, lat] = location;
        
        // Validate coordinates before storing
        if (typeof lng === 'number' && typeof lat === 'number' && 
            lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
          // Store as serializable array only
          const serializableLocation = [lng, lat];
          localStorage.setItem(LOCATION_KEY, JSON.stringify(serializableLocation));
        } else {
          console.error('Invalid coordinates for storage:', { lng, lat });
        }
      } else {
        localStorage.removeItem(LOCATION_KEY);
      }
    } catch (error) {
      console.error('Error storing location:', error);
    }
  };

  const getStoredTrackingState = (): boolean => {
    try {
      const stored = localStorage.getItem(TRACKING_KEY);
      const isTracking = stored === 'true';
      return isTracking;
    } catch (error) {
      console.error('Error retrieving tracking state:', error);
      return false;
    }
  };

  const setStoredTrackingState = (isTracking: boolean): void => {
    try {
      localStorage.setItem(TRACKING_KEY, isTracking.toString());
    } catch (error) {
      console.error('Error storing tracking state:', error);
    }
  };

  const clearStoredData = (): void => {
    try {
      localStorage.removeItem(LOCATION_KEY);
      localStorage.removeItem(TRACKING_KEY);
    } catch (error) {
      console.error('Error clearing stored data:', error);
    }
  };

  return {
    getStoredLocation,
    setStoredLocation,
    getStoredTrackingState,
    setStoredTrackingState,
    clearStoredData
  };
};
