
import { useState, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";

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
  const watchId = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const { toast } = useToast();

  const clearExistingTracking = () => {
    if (watchId.current !== null) {
      console.log('Clearing existing location watcher:', watchId.current);
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  };

  const startTracking = (
    onLocation: (result: LocationResult) => void,
    onError: (error: GeolocationPositionError) => void
  ) => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Location Error",
        description: "Geolocation is not supported in your browser.",
      });
      return;
    }

    clearExistingTracking();
    setIsTracking(true);
    setIsLoading(true);

    const handlePosition = (position: GeolocationPosition) => {
      console.log('Location update received:', {
        coords: [position.coords.longitude, position.coords.latitude],
        accuracy: position.coords.accuracy
      });
      
      setIsLoading(false);
      
      const result: LocationResult = {
        coords: [position.coords.longitude, position.coords.latitude],
        accuracy: position.coords.accuracy
      };
      onLocation(result);
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error('Location error:', error);
      setIsLoading(false);
      onError(error);
    };

    // First get current position with high accuracy
    navigator.geolocation.getCurrentPosition(
      handlePosition,
      handleError,
      getLocationOptions(true)
    );

    // Then start watching position
    watchId.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      getLocationOptions(true)
    );

    console.log('Started location tracking with watch ID:', watchId.current);
  };

  const stopTracking = () => {
    clearExistingTracking();
    setIsTracking(false);
    setIsLoading(false);
    console.log('Stopped location tracking');
  };

  return {
    startTracking,
    stopTracking,
    isTracking,
    isLoading
  };
};
