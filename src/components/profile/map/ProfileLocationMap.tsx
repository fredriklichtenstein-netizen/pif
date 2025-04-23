
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useMapbox } from "@/hooks/useMapbox";
import { addLocationPrivacy } from "@/utils/location/privacyOffset";
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
        // Create the map first so we can use it for water detection
        const map = new mapboxgl.Map({
          container: mapContainerRef.current!,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [coordinates.lng, coordinates.lat],
          zoom: 14,
          interactive: false,
        });
        
        mapRef.current = map;
        
        // Wait for the map to load before applying privacy offset
        await new Promise(resolve => {
          map.once('load', () => {
            console.log("Map loaded, now applying privacy offset");
            resolve(true);
          });
        });
        
        if (destroyed) return;
        
        // Now apply location privacy, passing the map for water detection
        // This matches exactly how it's done in MapMarkersLayer.tsx
        const [privateLng, privateLat] = await addLocationPrivacy(
          coordinates.lng,
          coordinates.lat,
          mapRef.current  // Pass map for water detection like MapMarkersLayer does
        );
        
        if (destroyed) return;
        
        console.log("Privacy-adjusted coordinates:", { 
          original: [coordinates.lng, coordinates.lat],
          private: [privateLng, privateLat] 
        });
        
        // Update the map center and add the marker after privacy is applied
        map.setCenter([privateLng, privateLat]);
        
        const marker = new mapboxgl.Marker()
          .setLngLat([privateLng, privateLat])
          .addTo(map);
        
        markerRef.current = marker;
        
        map.on('error', (e) => {
          console.error("Map error:", e);
        });
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
