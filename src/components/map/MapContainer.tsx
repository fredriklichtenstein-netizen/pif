
import type { Post } from "@/types/post";
import { useMapInitialization } from "./useMapInitialization";
import { MapMarkersLayer } from "./MapMarkersLayer";
import { Button } from "@/components/ui/button";
import { Locate } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

interface MapContainerProps {
  mapboxToken: string;
  posts: Post[];
  onPostClick: (postId: string) => void;
}

export const MapContainer = ({ mapboxToken, posts, onPostClick }: MapContainerProps) => {
  const { mapContainer, map, isMapReady } = useMapInitialization(mapboxToken);
  const locationMarker = useRef<mapboxgl.Marker | null>(null);
  const watchId = useRef<number | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  const createLocationMarker = (lngLat: [number, number]) => {
    if (!map) return;

    const el = document.createElement('div');
    el.className = 'location-marker';
    
    const style = document.createElement('style');
    style.textContent = `
      .location-marker {
        width: 24px;
        height: 24px;
        position: relative;
      }
      .location-marker::before {
        content: '';
        position: absolute;
        width: 24px;
        height: 24px;
        background: rgba(37, 99, 235, 0.2);
        border-radius: 50%;
        animation: pulse 2s infinite;
      }
      .location-marker::after {
        content: '';
        position: absolute;
        width: 12px;
        height: 12px;
        background: rgb(37, 99, 235);
        border: 2px solid white;
        border-radius: 50%;
        top: 6px;
        left: 6px;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
      }
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(3); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    if (locationMarker.current) {
      locationMarker.current.remove();
    }

    locationMarker.current = new mapboxgl.Marker({
      element: el,
      anchor: 'center'
    })
      .setLngLat(lngLat)
      .addTo(map);
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation || watchId.current !== null) return;

    setIsTracking(true);
    setIsLoadingLocation(true);

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        const lngLat: [number, number] = [lng, lat];
        
        setUserLocation(lngLat);
        createLocationMarker(lngLat);
        
        // Only fly to location on initial position
        if (isLoadingLocation) {
          map?.flyTo({
            center: lngLat,
            zoom: 14,
            duration: 2000,
            essential: true
          });
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLoadingLocation(false);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    );
  };

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
  };

  const toggleLocationTracking = () => {
    if (isTracking) {
      stopLocationTracking();
    } else {
      startLocationTracking();
    }
  };

  useEffect(() => {
    if (isMapReady && map) {
      setIsMapVisible(true);
      // Start tracking automatically
      startLocationTracking();
    }
    
    // Cleanup on unmount
    return () => {
      stopLocationTracking();
    };
  }, [isMapReady, map]);

  return (
    <div className="h-[calc(100vh-200px)] rounded-lg overflow-hidden relative bg-gray-50">
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ 
          opacity: isMapVisible ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      {isMapReady && map && (
        <>
          <MapMarkersLayer 
            map={map}
            posts={posts}
            onPostClick={onPostClick}
          />
          <Button
            onClick={toggleLocationTracking}
            className={`absolute bottom-4 right-4 bg-white hover:bg-gray-100 text-gray-800 cursor-pointer`}
            size="icon"
            variant="outline"
          >
            <Locate className={`h-4 w-4 ${isTracking ? 'text-blue-500' : ''}`} />
          </Button>
        </>
      )}
    </div>
  );
};
