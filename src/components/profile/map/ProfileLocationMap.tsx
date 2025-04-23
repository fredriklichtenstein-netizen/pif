
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useMapbox } from "@/hooks/useMapbox";
import { parseCoordinates } from "@/utils/post/parseCoordinates";
import "mapbox-gl/dist/mapbox-gl.css";

interface ProfileLocationMapProps {
  coordinates: { lng: number; lat: number };
}

export function ProfileLocationMap({ coordinates }: ProfileLocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const { mapToken, isLoading: isMapTokenLoading } = useMapbox();
  
  // Add log to debug the incoming coordinates
  console.log("ProfileLocationMap rendering with exact coordinates:", coordinates);
  
  useEffect(() => {
    if (!coordinates || !mapToken || !mapContainerRef.current) {
      console.log("Map initialization skipped:", { 
        hasCoordinates: !!coordinates, 
        hasMapToken: !!mapToken, 
        hasContainer: !!mapContainerRef.current 
      });
      return;
    }
    
    console.log("Initializing profile map with exact coordinates:", coordinates);
    mapboxgl.accessToken = mapToken;
    let destroyed = false;

    const initializeMap = async () => {
      try {
        if (destroyed) return;
        
        const map = new mapboxgl.Map({
          container: mapContainerRef.current!,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [coordinates.lng, coordinates.lat],
          zoom: 14,
          interactive: false,
        });
        
        map.on('load', () => {
          console.log("Map loaded successfully");
        });
        
        map.on('error', (e) => {
          console.error("Map error:", e);
        });
        
        const marker = new mapboxgl.Marker()
          .setLngLat([coordinates.lng, coordinates.lat])
          .addTo(map);
        
        mapRef.current = map;
        markerRef.current = marker;
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };

    initializeMap();

    return () => {
      destroyed = true;
      if (markerRef.current) markerRef.current.remove();
      if (mapRef.current) mapRef.current.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [coordinates, mapToken]);
  
  if (isMapTokenLoading) {
    return <div className="w-full h-[200px] rounded-lg border mb-4 bg-gray-100 flex items-center justify-center">
      <div className="text-sm text-gray-500">Loading map...</div>
    </div>;
  }
  
  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-[200px] rounded-lg border mb-4" 
      style={{ display: "block" }}
    />
  );
}
