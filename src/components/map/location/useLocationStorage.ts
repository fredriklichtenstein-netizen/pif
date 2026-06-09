
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

      // Self-heal: drop legacy non-JSON values (e.g. "(lng,lat)") that
      // would otherwise throw "Unexpected token (" on every read.
      const trimmed = stored.trim();
      if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) {
        localStorage.removeItem(LOCATION_KEY);
        return null;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        localStorage.removeItem(LOCATION_KEY);
        return null;
      }
      if (Array.isArray(parsed) && parsed.length === 2 &&
          typeof parsed[0] === 'number' && typeof parsed[1] === 'number') {
        const [lng, lat] = parsed;
        if (lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
          return [lng, lat];
        }
        return null;
      }
      return null;
    } catch {
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
