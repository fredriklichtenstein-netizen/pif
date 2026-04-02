
import { useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useToast } from "@/hooks/use-toast";
import { createLocationMarker } from './LocationMarker';
import { useTranslation } from 'react-i18next';

interface LocationTrackingResult {
  userLocation: [number, number] | null;
  isLoadingLocation: boolean;
  goToMyLocation: () => void;
}

export const useLocationTracking = (map: mapboxgl.Map | null): LocationTrackingResult => {
  const locationMarker = useRef<mapboxgl.Marker | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const updateLocationMarker = (lngLat: [number, number]) => {
    if (!map) return;
    try {
      if (locationMarker.current?.getElement()?.parentNode) locationMarker.current.remove();
      locationMarker.current = createLocationMarker(map, lngLat);
    } catch (error) { console.error("Error updating location marker:", error); }
  };

  const goToMyLocation = () => {
    if (!map) { console.log('Cannot get location: map not ready'); return; }
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: t('map.location_error'), description: t('interactions.geolocation_not_supported') });
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
        setUserLocation(coords);
        setIsLoadingLocation(false);
        updateLocationMarker(coords);
        map.flyTo({ center: coords, zoom: 13, duration: 1500, essential: true });
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLoadingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast({ variant: "destructive", title: t('interactions.location_permission_denied'), description: t('interactions.location_permission_description') });
        } else {
          toast({ variant: "destructive", title: t('interactions.location_unavailable'), description: t('interactions.location_unavailable_description') });
        }
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
  };

  return { userLocation, isLoadingLocation, goToMyLocation };
};
