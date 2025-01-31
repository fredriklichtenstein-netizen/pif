import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapContainerProps {
  mapboxToken: string;
  onMapLoad: (map: mapboxgl.Map) => void;
}

export const MapContainer = ({ mapboxToken, onMapLoad }: MapContainerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [18.0686, 59.3293], // Stockholm center
      zoom: 11,
    });

    newMap.addControl(new mapboxgl.NavigationControl(), "top-right");
    
    newMap.on('load', () => {
      map.current = newMap;
      onMapLoad(newMap);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken, onMapLoad]);

  return (
    <div className="h-[calc(100vh-200px)] rounded-lg overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};