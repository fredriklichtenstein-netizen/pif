
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useMapbox } from "@/hooks/useMapbox";
import { addLocationPrivacy } from "@/utils/locationPrivacy";
import { parseCoordinates } from "@/utils/post/parseCoordinates";
import "mapbox-gl/dist/mapbox-gl.css";

interface ProfileLocationMapProps {
  coordinates: { lng: number; lat: number };
}

export function ProfileLocationMap({ coordinates }: ProfileLocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  // marker removed for privacy
  const { mapToken, isLoading: isMapTokenLoading } = useMapbox();
  
  // Add log to debug the incoming coordinates
  console.log("ProfileLocationMap rendering with coordinates:", coordinates);
  
  useEffect(() => {
    if (!coordinates || !mapToken || !mapContainerRef.current) {
      console.log("Map initialization skipped:", { 
        hasCoordinates: !!coordinates, 
        hasMapToken: !!mapToken, 
        hasContainer: !!mapContainerRef.current 
      });
      return;
    }
    
    console.log("Initializing profile map with coordinates:", coordinates);
    mapboxgl.accessToken = mapToken;
    let destroyed = false;

    const initializeMap = async () => {
      try {
        // Process coordinates exactly like in MapMarkersLayer.tsx
        // Apply location privacy to the coordinates - note: removed the third argument (map)
        // which matches how MapMarkersLayer does it
        const [privateLng, privateLat] = await addLocationPrivacy(
          coordinates.lng,
          coordinates.lat
        );
        
        if (destroyed) return;
        
        console.log("Privacy-adjusted coordinates for profile map:", privateLng, privateLat);
        
        const map = new mapboxgl.Map({
          container: mapContainerRef.current!,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [privateLng, privateLat],
          zoom: 13,
          interactive: false,
          dragPan: false,
          scrollZoom: false,
          boxZoom: false,
          dragRotate: false,
          doubleClickZoom: false,
          touchZoomRotate: false,
          keyboard: false,
        });
        
        mapRef.current = map;
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
      style={{ display: "block" }} // Force display
    />
  );
}
