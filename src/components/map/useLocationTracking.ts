
import { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { useToast } from "@/components/ui/use-toast";
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
  };

  const restartLocationTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    if (isTracking && map) {
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLngLat: [number, number] = [
            position.coords.longitude,
            position.coords.latitude
          ];
          setUserLocation(newLngLat);
          if (locationMarker.current) {
            locationMarker.current.remove();
          }
          locationMarker.current = createLocationMarker(map, newLngLat);
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
    console.error("Geolocation error:", error);

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
          if (isTracking) {
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

    stopLocationTracking();
    setIsTracking(true);
    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lngLat: [number, number] = [
          position.coords.longitude,
          position.coords.latitude
        ];
        
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
            setUserLocation(newLngLat);
            if (locationMarker.current) {
              locationMarker.current.remove();
            }
            locationMarker.current = createLocationMarker(map, newLngLat);
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
