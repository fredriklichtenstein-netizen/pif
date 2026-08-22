
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

interface LocationOptions {
  enableHighAccuracy: boolean;
  maximumAge: number;
  timeout: number;
}

export interface LocationResult {
  coords: [number, number];
  accuracy: number;
}

interface LocationProvider {
  startTracking: (onLocation: (result: LocationResult) => void, onError: (error: GeolocationPositionError) => void) => void;
  stopTracking: () => void;
  isTracking: boolean;
  isLoading: boolean;
}

const getLocationOptions = (highAccuracy: boolean): LocationOptions => ({
  enableHighAccuracy: highAccuracy,
  maximumAge: highAccuracy ? 10000 : 60000,
  timeout: highAccuracy ? 15000 : 30000
});

export const useLocationProvider = (): LocationProvider => {
  const [isLoading, setIsLoading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  // One-shot fetch only. This used to ALSO start a watchPosition() with the
  // same callbacks as getCurrentPosition() -- watchPosition is for
  // continuous tracking, which the only consumer (FeedDistanceFilter's
  // "use current location" button) never needed and never stopped. That
  // caused two things: a single failure fired onError twice (back-to-back
  // "not supported" then "Timeout expired" toasts, confirmed live), and a
  // successful fetch left a geolocation watch running in the background
  // forever since stopTracking() was never called.
  const startTracking = (
    onLocation: (result: LocationResult) => void,
    onError: (error: GeolocationPositionError) => void
  ) => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: t('map.location_error'), description: t('interactions.geolocation_not_supported') });
      return;
    }

    setIsTracking(true);
    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLoading(false);
        setIsTracking(false);
        onLocation({ coords: [position.coords.longitude, position.coords.latitude], accuracy: position.coords.accuracy });
      },
      (error) => {
        console.error('Location error:', error);
        setIsLoading(false);
        setIsTracking(false);
        onError(error);
      },
      getLocationOptions(true)
    );
  };

  const stopTracking = () => {
    setIsTracking(false);
    setIsLoading(false);
  };

  return { startTracking, stopTracking, isTracking, isLoading };
};
