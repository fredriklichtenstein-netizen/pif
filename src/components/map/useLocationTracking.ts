
import { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { useToast } from "@/hooks/use-toast";
import { createLocationMarker } from './LocationMarker';
import { useLocationProvider, type LocationResult } from './location/useLocationProvider';
import { useLocationStorage } from './location/useLocationStorage';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const isFirstMount = useRef(true);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(storage.getStoredLocation());
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState(storage.getStoredTrackingState());

  const updateLocationMarker = (lngLat: [number, number]) => {
    if (!map) return;
    try {
      if (locationMarker.current?.getElement()?.parentNode) locationMarker.current.remove();
      locationMarker.current = createLocationMarker(map, lngLat);
    } catch (error) { console.error("Error updating location marker:", error); }
  };

  const shouldFlyRef = useRef(false);

  const handleLocationUpdate = (result: LocationResult) => {
    console.log('Got position:', result.coords, 'Accuracy:', result.accuracy, 'meters');
    setUserLocation(result.coords);
    setAccuracy(result.accuracy);
    storage.setStoredLocation(result.coords);
    if (map) {
      updateLocationMarker(result.coords);
      if (!userLocation || shouldFlyRef.current) {
        map.flyTo({ center: result.coords, zoom: 13, duration: 1500, essential: true });
        shouldFlyRef.current = false;
      }
    }
    retryCount.current = 0;
  };

  const handleLocationError = (error: GeolocationPositionError) => {
    console.error("Geolocation error:", error);
    if (error.code === error.PERMISSION_DENIED) {
      stopLocationTracking();
      toast({ variant: "destructive", title: t('interactions.location_permission_denied'), description: t('interactions.location_permission_description') });
    } else if (error.code === error.POSITION_UNAVAILABLE) {
      stopLocationTracking();
      toast({ variant: "destructive", title: t('interactions.location_unavailable'), description: t('interactions.location_unavailable_description') });
    } else if (error.code === error.TIMEOUT) {
      retryCount.current += 1;
      if (retryCount.current <= 3) {
        if (retryCount.current === 1) {
          toast({ title: t('interactions.location_taking_longer'), description: t('interactions.location_taking_longer_description') });
        }
        console.log(`Retrying location tracking (attempt ${retryCount.current}/3)`);
      } else {
        stopLocationTracking();
        toast({ variant: "destructive", title: t('interactions.location_unavailable'), description: t('interactions.location_unavailable_retry') });
      }
    }
  };

  const startLocationTracking = () => {
    if (!map) { console.log('Cannot start location tracking: map not ready'); return; }
    console.log('Starting location tracking');
    shouldFlyRef.current = true;
    setIsTracking(true);
    storage.setStoredTrackingState(true);
    locationProvider.startTracking(handleLocationUpdate, handleLocationError);
  };

  const stopLocationTracking = () => {
    console.log('Stopping location tracking');
    locationProvider.stopTracking();
    if (locationMarker.current) {
      try { locationMarker.current.remove(); } catch (error) { console.error("Error removing location marker:", error); }
      locationMarker.current = null;
    }
    setIsTracking(false); setAccuracy(null);
    storage.setStoredTrackingState(false);
    retryCount.current = 0;
  };

  useEffect(() => {
    if (!map) { if (isTracking) { console.log('Map not ready, stopping location tracking'); stopLocationTracking(); } return; }
    const shouldTrack = storage.getStoredTrackingState();
    if (shouldTrack && !locationProvider.isTracking) { console.log('Initializing location tracking with new map instance'); startLocationTracking(); }
    return () => {
      if (locationMarker.current) {
        console.log('Cleaning up location marker for map instance change');
        try { locationMarker.current.remove(); } catch (error) { console.error("Error cleaning up location marker:", error); }
        locationMarker.current = null;
      }
    };
  }, [map]);

  return { userLocation, isLoadingLocation: locationProvider.isLoading, isTracking, accuracy, toggleLocationTracking: isTracking ? stopLocationTracking : startLocationTracking };
};
