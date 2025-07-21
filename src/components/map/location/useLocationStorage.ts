
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
        console.log('Retrieved stored location:', parsed);
        return parsed as [number, number];
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
        localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
        console.log('Stored location:', location);
      } else {
        localStorage.removeItem(LOCATION_KEY);
        console.log('Cleared stored location');
      }
    } catch (error) {
      console.error('Error storing location:', error);
    }
  };

  const getStoredTrackingState = (): boolean => {
    try {
      const stored = localStorage.getItem(TRACKING_KEY);
      const isTracking = stored === 'true';
      console.log('Retrieved tracking state:', isTracking);
      return isTracking;
    } catch (error) {
      console.error('Error retrieving tracking state:', error);
      return false;
    }
  };

  const setStoredTrackingState = (isTracking: boolean): void => {
    try {
      localStorage.setItem(TRACKING_KEY, isTracking.toString());
      console.log('Stored tracking state:', isTracking);
    } catch (error) {
      console.error('Error storing tracking state:', error);
    }
  };

  const clearStoredData = (): void => {
    try {
      localStorage.removeItem(LOCATION_KEY);
      localStorage.removeItem(TRACKING_KEY);
      console.log('Cleared all stored location data');
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
