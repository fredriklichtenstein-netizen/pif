
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
  const retryCount = useRef(0);
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
  const { toast } = useToast();

  // Clear any existing location tracking
  const clearExistingTracking = () => {
    if (watchId.current !== null) {
      console.log('Clearing existing location watcher:', watchId.current);
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (locationMarker.current && map) {
      locationMarker.current.remove();
      locationMarker.current = null;
    }
  };

  const handleLocationError = (error: GeolocationPositionError) => {
    console.error("Geolocation error:", {
      code: error.code,
      message: error.message,
      PERMISSION_DENIED: error.PERMISSION_DENIED,
      POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
      TIMEOUT: error.TIMEOUT
    });
    
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
        // Only show toast on first retry
        if (retryCount.current === 1) {
          toast({
            title: "Location Taking Longer",
            description: "Still trying to get your location...",
          });
        }
        console.log(`Retrying location tracking (attempt ${retryCount.current}/3)`);
        setTimeout(startLocationTracking, 1000);
      } else {
        stopLocationTracking();
        toast({
          variant: "destructive",
          title: "Location Unavailable",
          description: "Unable to get your location after several attempts. Please try again later.",
        });
      }
    }
    setIsLoadingLocation(false);
  };

  const stopLocationTracking = () => {
    clearExistingTracking();
    setIsTracking(false);
    localStorage.setItem(LOCATION_TRACKING_KEY, 'false');
    localStorage.removeItem(USER_LOCATION_KEY);
    setUserLocation(null);
    setIsLoadingLocation(false);
    retryCount.current = 0;
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

    // Don't clear existing tracking on retry attempts
    if (retryCount.current === 0) {
      clearExistingTracking();
      setIsTracking(true);
      localStorage.setItem(LOCATION_TRACKING_KEY, 'true');
    }
    
    setIsLoadingLocation(true);

    // First get current position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        retryCount.current = 0;
        const lngLat: [number, number] = [
          position.coords.longitude,
          position.coords.latitude
        ];
        
        console.log('Got initial position:', lngLat);
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

        // Then start watching position
        watchId.current = navigator.geolocation.watchPosition(
          (watchPosition) => {
            const newLngLat: [number, number] = [
              watchPosition.coords.longitude,
              watchPosition.coords.latitude
            ];
            
            console.log('Got updated position:', newLngLat);
            setUserLocation(newLngLat);
            localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(newLngLat));
            
            if (map) {
              updateLocationMarker(newLngLat);
            }
          },
          handleLocationError,
          { 
            enableHighAccuracy: true, 
            maximumAge: 30000, // Increased from 10000 to reduce updates
            timeout: 30000 // Increased from 10000 to allow more time
          }
        );
        console.log('Started location watcher:', watchId.current);
      },
      handleLocationError,
      { 
        enableHighAccuracy: true, 
        maximumAge: 0, // No cache for initial position
        timeout: 30000 // Increased from 10000 to allow more time
      }
    );
  };

  useEffect(() => {
    // Only start tracking if map is available and tracking was previously enabled
    const shouldTrack = localStorage.getItem(LOCATION_TRACKING_KEY) === 'true';
    if (map && shouldTrack && !watchId.current) {
      console.log('Initializing location tracking');
      startLocationTracking();
    }

    return () => {
      // Only clear visual elements on unmount, preserve tracking state
      if (locationMarker.current && map) {
        console.log('Cleaning up location marker');
        locationMarker.current.remove();
        locationMarker.current = null;
      }
    };
  }, [map]);

  const toggleLocationTracking = () => {
    if (isTracking) {
      console.log('Stopping location tracking');
      stopLocationTracking();
    } else {
      console.log('Starting location tracking');
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
