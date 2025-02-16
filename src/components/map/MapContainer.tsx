
import type { Post } from "@/types/post";
import { useMapInitialization } from "./useMapInitialization";
import { MapMarkersLayer } from "./MapMarkersLayer";
import { Button } from "@/components/ui/button";
import { Locate } from "lucide-react";
import { isUrbanArea } from "@/utils/locationPrivacy";
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
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const createLocationMarker = (lngLat: [number, number]) => {
    if (!map) return;

    // Create marker element
    const el = document.createElement('div');
    el.className = 'location-marker';
    
    // Add pulse effect styles
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

    // Remove existing marker if it exists
    if (locationMarker.current) {
      locationMarker.current.remove();
    }

    // Create and add new marker
    locationMarker.current = new mapboxgl.Marker({
      element: el,
      anchor: 'center'
    })
      .setLngLat(lngLat)
      .addTo(map);
  };

  const handleGeolocation = () => {
    if (!map || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        const lngLat: [number, number] = [lng, lat];
        
        // Set zoom based on urban/rural area using current zoom and map data
        const currentZoom = map.getZoom();
        const zoom = isUrbanArea(lat, lng, currentZoom, map) ? 13.5 : 8.5;
        
        // Update user location and create/update marker
        setUserLocation(lngLat);
        createLocationMarker(lngLat);
        
        map.flyTo({
          center: lngLat,
          zoom: zoom,
          duration: 2000,
          essential: true
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
      }
    );
  };

  // Ensure marker stays visible when map moves
  useEffect(() => {
    if (userLocation && !locationMarker.current) {
      createLocationMarker(userLocation);
    }
  }, [map, userLocation]);

  return (
    <div className="h-[calc(100vh-200px)] rounded-lg overflow-hidden relative">
      <div ref={mapContainer} className="w-full h-full" />
      {isMapReady && map && (
        <>
          <MapMarkersLayer 
            map={map}
            posts={posts}
            onPostClick={onPostClick}
          />
          <Button
            onClick={handleGeolocation}
            className="absolute bottom-4 right-4 bg-white hover:bg-gray-100 text-gray-800"
            size="icon"
            variant="outline"
          >
            <Locate className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
};
