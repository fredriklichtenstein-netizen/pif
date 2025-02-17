
import { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { useToast } from "@/hooks/use-toast";
import { createLocationMarker } from './LocationMarker';
import { useLocationProvider, type LocationResult } from './location/useLocationProvider';
import { useLocationStorage } from './location/useLocationStorage';

interface LocationTrackingResult {
  userLocation: [number, number] | null;
  isLoadingLocation: boolean;
  isTracking: boolean;
  toggleLocationTracking: () => void;
}

export const useLocationTracking = (map: mapboxgl.Map | null): LocationTrackingResult => {
  const locationMarker = useRef<mapboxgl.Marker | null>(null);
  const retryCount = useRef(0);
  const storage = useLocationStorage();
  const locationProvider = useLocationProvider();
  const { toast } = useToast();

  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    storage.getStoredLocation()
  );

  const [isTracking, setIsTracking] = useState(
    storage.getStoredTrackingState()
  );

  const updateLocationMarker = (lngLat: [number, number]) => {
    if (!map) return;

    try {
      if (locationMarker.current) {
        locationMarker.current.remove();
      }
      locationMarker.current = createLocationMarker(map, lngLat);
    } catch (error) {
      console.error("Error updating location marker:", error);
    }
  };

  const handleLocationUpdate = (result: LocationResult) => {
    console.log('Got position:', result.coords, 'Accuracy:', result.accuracy, 'meters');
    setUserLocation(result.coords);
    storage.setStoredLocation(result.coords);
    
    if (map) {
      updateLocationMarker(result.coords);
      // Only fly to location on initial position
      if (!userLocation) {
        map.flyTo({
          center: result.coords,
          zoom: 14,
          duration: 2000,
          essential: true
        });
      }
    }
  };

  const handleLocationError = (error: GeolocationPositionError) => {
    console.error("Geolocation error:", error);
    
    if (error.code === error.PERMISSION_DENIED) {
      stopLocationTracking();
      toast({
        variant: "destructive",
        title: "Location Permission Denied",
        description: "Please enable location permissions in your browser settings and refresh the page.",
      });
    } else if (error.code === error.POSITION_UNAVAILABLE) {
      stopLocationTracking();
      toast({
        variant: "destructive",
        title: "Location Unavailable",
        description: "Could not determine your location. Please check your device's location services.",
      });
    } else if (error.code === error.TIMEOUT) {
      retryCount.current += 1;
      if (retryCount.current <= 3) {
        if (retryCount.current === 1) {
          toast({
            title: "Location Taking Longer",
            description: "Still trying to get your location...",
          });
        }
        console.log(`Retrying location tracking (attempt ${retryCount.current}/3)`);
        startLocationTracking();
      } else {
        stopLocationTracking();
        toast({
          variant: "destructive",
          title: "Location Unavailable",
          description: "Unable to get your location after several attempts. Please try again later.",
        });
      }
    }
  };

  const startLocationTracking = () => {
    setIsTracking(true);
    storage.setStoredTrackingState(true);
    locationProvider.startTracking(handleLocationUpdate, handleLocationError);
  };

  const stopLocationTracking = () => {
    locationProvider.stopTracking();
    if (locationMarker.current && map) {
      locationMarker.current.remove();
      locationMarker.current = null;
    }
    setIsTracking(false);
    storage.setStoredTrackingState(false);
    storage.setStoredLocation(null);
    setUserLocation(null);
    retryCount.current = 0;
  };

  useEffect(() => {
    const shouldTrack = storage.getStoredTrackingState();
    if (map && shouldTrack && !locationProvider.isTracking) {
      console.log('Initializing location tracking');
      startLocationTracking();
    }

    return () => {
      if (locationMarker.current && map) {
        console.log('Cleaning up location marker');
        locationMarker.current.remove();
        locationMarker.current = null;
      }
    };
  }, [map]);

  return {
    userLocation,
    isLoadingLocation: locationProvider.isLoading,
    isTracking,
    toggleLocationTracking: isTracking ? stopLocationTracking : startLocationTracking,
  };
};
