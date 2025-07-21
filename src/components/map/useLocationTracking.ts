
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
  accuracy: number | null;
  toggleLocationTracking: () => void;
}

export const useLocationTracking = (map: mapboxgl.Map | null): LocationTrackingResult => {
  const locationMarker = useRef<mapboxgl.Marker | null>(null);
  const retryCount = useRef(0);
  const storage = useLocationStorage();
  const locationProvider = useLocationProvider();
  const { toast } = useToast();
  const isFirstMount = useRef(true);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    storage.getStoredLocation()
  );

  const [accuracy, setAccuracy] = useState<number | null>(null);

  const [isTracking, setIsTracking] = useState(
    storage.getStoredTrackingState()
  );

  const updateLocationMarker = (lngLat: [number, number]) => {
    if (!map) return;

    try {
      // Only remove the old marker if it's attached to a map
      if (locationMarker.current?.getElement()?.parentNode) {
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
    setAccuracy(result.accuracy);
    storage.setStoredLocation(result.coords);
    
    if (map) {
      updateLocationMarker(result.coords);
      // Only fly to location on first time getting a position
      if (!userLocation) {
        map.flyTo({
          center: result.coords,
          zoom: 14,
          duration: 2000,
          essential: true
        });
      }
    }

    // Reset retry count on successful location update
    retryCount.current = 0;
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
        // Don't call startLocationTracking again, let the provider handle retries
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
    if (!map) {
      console.log('Cannot start location tracking: map not ready');
      return;
    }
    console.log('Starting location tracking');
    setIsTracking(true);
    storage.setStoredTrackingState(true);
    locationProvider.startTracking(handleLocationUpdate, handleLocationError);
  };

  const stopLocationTracking = () => {
    console.log('Stopping location tracking');
    locationProvider.stopTracking();
    if (locationMarker.current) {
      try {
        locationMarker.current.remove();
      } catch (error) {
        console.error("Error removing location marker:", error);
      }
      locationMarker.current = null;
    }
    setIsTracking(false);
    setAccuracy(null);
    storage.setStoredTrackingState(false);
    retryCount.current = 0;
  };

  // Handle tracking state when map changes
  useEffect(() => {
    if (!map) {
      if (isTracking) {
        console.log('Map not ready, stopping location tracking');
        stopLocationTracking();
      }
      return;
    }

    // Restore tracking state if needed
    const shouldTrack = storage.getStoredTrackingState();
    if (shouldTrack && !locationProvider.isTracking) {
      console.log('Initializing location tracking with new map instance');
      startLocationTracking();
    }
    
    // Cleanup function
    return () => {
      // Only clean up marker, don't stop tracking
      if (locationMarker.current) {
        console.log('Cleaning up location marker for map instance change');
        try {
          locationMarker.current.remove();
        } catch (error) {
          console.error("Error cleaning up location marker:", error);
        }
        locationMarker.current = null;
      }
    };
  }, [map]);

  return {
    userLocation,
    isLoadingLocation: locationProvider.isLoading,
    isTracking,
    accuracy,
    toggleLocationTracking: isTracking ? stopLocationTracking : startLocationTracking,
  };
};
