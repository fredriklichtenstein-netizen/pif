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

const LOCATION_TRACKING_KEY = 'map_location_tracking_enabled';
const USER_LOCATION_KEY = 'map_user_location';

export const useLocationTracking = (map: mapboxgl.Map | null): LocationTrackingResult => {
  const locationMarker = useRef<mapboxgl.Marker | null>(null);
  const watchId = useRef<number | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(() => {
    try {
      const stored = localStorage.getItem(USER_LOCATION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isTracking, setIsTracking] = useState(() => {
    try {
      const stored = localStorage.getItem(LOCATION_TRACKING_KEY);
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });
  const lastErrorTime = useRef<number>(0);
  const errorCount = useRef<number>(0);
  const { toast } = useToast();

  const handleLocationError = (error: GeolocationPositionError) => {
    console.error("Geolocation error:", error);
    setIsLoadingLocation(false);

    const message = error.code === error.PERMISSION_DENIED
      ? "Please enable location permissions in your browser settings."
      : error.code === error.POSITION_UNAVAILABLE
        ? "Location information is unavailable."
        : "Location request timed out.";

    toast({
      variant: "destructive",
      title: "Location Error",
      description: message,
    });

    if (error.code !== error.TIMEOUT || errorCount.current >= 3) {
      stopLocationTracking();
    }
  };

  const stopLocationTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (locationMarker.current && map) {
      locationMarker.current.remove();
      locationMarker.current = null;
    }
    setIsTracking(false);
    localStorage.setItem(LOCATION_TRACKING_KEY, 'false');
    localStorage.removeItem(USER_LOCATION_KEY);
    setUserLocation(null);
    setIsLoadingLocation(false);
    errorCount.current = 0;
    lastErrorTime.current = 0;
  };

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

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Location Error",
        description: "Geolocation is not supported in your browser.",
      });
      return;
    }

    setIsTracking(true);
    localStorage.setItem(LOCATION_TRACKING_KEY, 'true');
    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lngLat: [number, number] = [
          position.coords.longitude,
          position.coords.latitude
        ];
        
        setUserLocation(lngLat);
        localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(lngLat));
        
        if (map) {
          updateLocationMarker(lngLat);
          map.flyTo({
            center: lngLat,
            zoom: 14,
            duration: 2000,
            essential: true
          });
        }
        
        setIsLoadingLocation(false);

        watchId.current = navigator.geolocation.watchPosition(
          (watchPosition) => {
            const newLngLat: [number, number] = [
              watchPosition.coords.longitude,
              watchPosition.coords.latitude
            ];
            
            setUserLocation(newLngLat);
            localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(newLngLat));
            
            if (map) {
              updateLocationMarker(newLngLat);
            }
            errorCount.current = 0;
          },
          handleLocationError,
          { enableHighAccuracy: true, maximumAge: 300000, timeout: 30000 }
        );
      },
      handleLocationError,
      { enableHighAccuracy: true, maximumAge: 300000, timeout: 30000 }
    );
  };

  useEffect(() => {
    // Only start tracking if map is available and tracking was previously enabled
    const shouldTrack = localStorage.getItem(LOCATION_TRACKING_KEY) === 'true';
    if (map && shouldTrack && !isTracking) {
      startLocationTracking();
    }

    // Only clean up marker on unmount, keep other state
    return () => {
      if (locationMarker.current && map) {
        locationMarker.current.remove();
        locationMarker.current = null;
      }
    };
  }, [map]);

  const toggleLocationTracking = () => {
    if (isTracking) {
      stopLocationTracking();
    } else {
      startLocationTracking();
    }
  };

  return {
    userLocation,
    isLoadingLocation,
    isTracking,
    toggleLocationTracking,
  };
};
