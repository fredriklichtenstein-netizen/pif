
const LOCATION_TRACKING_KEY = 'map_location_tracking_enabled';
const USER_LOCATION_KEY = 'map_user_location';

export const useLocationStorage = () => {
  const getStoredLocation = (): [number, number] | null => {
    try {
      const stored = localStorage.getItem(USER_LOCATION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const getStoredTrackingState = (): boolean => {
    try {
      const stored = localStorage.getItem(LOCATION_TRACKING_KEY);
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  };

  const setStoredLocation = (location: [number, number] | null) => {
    if (location) {
      localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(location));
    } else {
      localStorage.removeItem(USER_LOCATION_KEY);
    }
  };

  const setStoredTrackingState = (isTracking: boolean) => {
    localStorage.setItem(LOCATION_TRACKING_KEY, JSON.stringify(isTracking));
  };

  return {
    getStoredLocation,
    getStoredTrackingState,
    setStoredLocation,
    setStoredTrackingState
  };
};
