
import { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { useToast } from "@/hooks/use-toast";
import { createLocationMarker } from './LocationMarker';

interface LocationTrackingResult {
  userLocation: [number, number] | null;
  isLoadingLocation: boolean;
  isTracking: boolean;
  toggleLocationTracking: () => void;
}

export const useLocationTracking = (map: mapboxgl.Map | null): LocationTrackingResult => {
  const locationMarker = useRef<mapboxgl.Marker | null>(null);
  const watchId = useRef<number | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const lastErrorTime = useRef<number>(0);
  const errorCount = useRef<number>(0);
  const { toast } = useToast();

  const stopLocationTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);
    if (locationMarker.current) {
      locationMarker.current.remove();
      locationMarker.current = null;
    }
    setUserLocation(null);
    setIsLoadingLocation(false);
    // Reset error tracking when stopping
    errorCount.current = 0;
    lastErrorTime.current = 0;
  };

  const restartLocationTracking = () => {
    // Check if we've had too many errors recently
    const now = Date.now();
    if (now - lastErrorTime.current < 10000) { // Within 10 seconds
      errorCount.current++;
      if (errorCount.current > 3) {
        console.log("Too many errors, stopping location tracking");
        stopLocationTracking();
        toast({
          variant: "destructive",
          title: "Location Error",
          description: "Unable to get a stable location signal. Please try again later.",
        });
        return;
      }
    } else {
      // Reset error count if it's been more than 10 seconds
      errorCount.current = 1;
    }
    lastErrorTime.current = now;

    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    if (isTracking && map) {
      console.log("Restarting location tracking, attempt:", errorCount.current);
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLngLat: [number, number] = [
            position.coords.longitude,
            position.coords.latitude
          ];
          console.log("Received new position:", newLngLat);
          setUserLocation(newLngLat);
          if (locationMarker.current) {
            locationMarker.current.remove();
          }
          locationMarker.current = createLocationMarker(map, newLngLat);
          // Reset error count on successful position
          errorCount.current = 0;
        },
        handleLocationError,
        {
          enableHighAccuracy: true,
          maximumAge: 300000, // Allow using cached positions up to 5 minutes old
          timeout: 30000 // 30 second timeout for each attempt
        }
      );
    }
  };

  const handleLocationError = (error: GeolocationPositionError) => {
    console.error("Geolocation error:", error, "Code:", error.code, "Message:", error.message);

    // Don't reset tracking state for timeout errors, as we'll try to recover
    if (error.code !== error.TIMEOUT) {
      setIsLoadingLocation(false);
      setIsTracking(false);
      if (locationMarker.current) {
        locationMarker.current.remove();
        locationMarker.current = null;
      }
      setUserLocation(null);
    }

    if (map) {
      let message = "Unable to get your location. ";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message += "Please enable location permissions in your browser settings.";
          break;
        case error.POSITION_UNAVAILABLE:
          message += "Location information is unavailable.";
          break;
        case error.TIMEOUT:
          if (isTracking && errorCount.current < 3) {
            console.log("Attempting to recover from timeout...");
            restartLocationTracking();
            return;
          }
          message += "Location request timed out.";
          break;
        default:
          message += "An unknown error occurred.";
      }

      // Only show toast for non-timeout errors or if we're not tracking
      if (error.code !== error.TIMEOUT || !isTracking) {
        toast({
          variant: "destructive",
          title: "Location Error",
          description: message,
        });
      }
    }
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation || !map) {
      toast({
        variant: "destructive",
        title: "Location Error",
        description: "Geolocation is not supported in your browser.",
      });
      return;
    }

    stopLocationTracking(); // This will reset error counts
    setIsTracking(true);
    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lngLat: [number, number] = [
          position.coords.longitude,
          position.coords.latitude
        ];
        
        console.log("Initial position acquired:", lngLat);
        setUserLocation(lngLat);
        if (locationMarker.current) {
          locationMarker.current.remove();
        }
        locationMarker.current = createLocationMarker(map, lngLat);
        
        map.flyTo({
          center: lngLat,
          zoom: 14,
          duration: 2000,
          essential: true
        });
        setIsLoadingLocation(false);

        watchId.current = navigator.geolocation.watchPosition(
          (watchPosition) => {
            const newLngLat: [number, number] = [
              watchPosition.coords.longitude,
              watchPosition.coords.latitude
            ];
            console.log("Watch position update:", newLngLat);
            setUserLocation(newLngLat);
            if (locationMarker.current) {
              locationMarker.current.remove();
            }
            locationMarker.current = createLocationMarker(map, newLngLat);
            // Reset error count on successful position
            errorCount.current = 0;
          },
          handleLocationError,
          {
            enableHighAccuracy: true,
            maximumAge: 300000, // Allow using cached positions up to 5 minutes old
            timeout: 30000 // 30 second timeout for each attempt
          }
        );
      },
      handleLocationError,
      { 
        enableHighAccuracy: true, 
        maximumAge: 300000, // Also use 5-minute cache for initial position
        timeout: 30000 // 30 second timeout for initial position
      }
    );
  };

  const toggleLocationTracking = () => {
    if (isTracking) {
      stopLocationTracking();
    } else {
      startLocationTracking();
    }
  };

  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, []);

  return {
    userLocation,
    isLoadingLocation,
    isTracking,
    toggleLocationTracking,
  };
};
