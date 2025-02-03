import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapContainerProps {
  mapboxToken: string;
  onMapLoad: (map: mapboxgl.Map) => void;
}

export const MapContainer = ({ mapboxToken, onMapLoad }: MapContainerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || mapInstance.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [18.0686, 59.3293], // Stockholm center
      zoom: 11,
    });

    mapInstance.current = newMap;

    // Wait for both style and map to be loaded before initializing
    newMap.on('style.load', () => {
      if (newMap.loaded()) {
        onMapLoad(newMap);
      } else {
        newMap.on('load', () => {
          onMapLoad(newMap);
        });
      }
    });

    newMap.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [mapboxToken]); // Only re-run if mapboxToken changes

  return (
    <div className="h-[calc(100vh-200px)] rounded-lg overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};