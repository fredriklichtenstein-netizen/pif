import { safeParseJSON, safeRemoveItem, safeStringify, safeGetItem, safeSetItem } from "@/utils/safeStorage";

interface LocationStorage {
  getStoredLocation: () => [number, number] | null;
  setStoredLocation: (location: [number, number] | null) => void;
  getStoredTrackingState: () => boolean;
  setStoredTrackingState: (isTracking: boolean) => void;
  clearStoredData: () => void;
}

const LOCATION_KEY = 'pif_user_location';
const TRACKING_KEY = 'pif_location_tracking';

const isLngLat = (v: unknown): v is [number, number] =>
  Array.isArray(v) && v.length === 2 &&
  typeof v[0] === 'number' && typeof v[1] === 'number' &&
  v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90;

export const useLocationStorage = (): LocationStorage => {
  const getStoredLocation = (): [number, number] | null => {
    const parsed = safeParseJSON<[number, number] | null>(LOCATION_KEY, null, (v): v is [number, number] => isLngLat(v));
    return parsed;
  };

  const setStoredLocation = (location: [number, number] | null): void => {
    if (location && isLngLat(location)) {
      safeStringify(LOCATION_KEY, [location[0], location[1]]);
    } else {
      safeRemoveItem(LOCATION_KEY);
    }
  };

  const getStoredTrackingState = (): boolean => {
    return safeGetItem(TRACKING_KEY) === 'true';
  };

  const setStoredTrackingState = (isTracking: boolean): void => {
    safeSetItem(TRACKING_KEY, isTracking.toString());
  };

  const clearStoredData = (): void => {
    safeRemoveItem(LOCATION_KEY);
    safeRemoveItem(TRACKING_KEY);
  };

  return {
    getStoredLocation,
    setStoredLocation,
    getStoredTrackingState,
    setStoredTrackingState,
    clearStoredData,
  };
};
