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
    
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [18.0686, 59.3293], // Stockholm center
      zoom: 11,
    });

    // Wait for both style and map to load
    const setup = () => {
      if (map.loaded() && map.isStyleLoaded()) {
        onMapLoad(map);
      } else {
        setTimeout(setup, 100);
      }
    };

    map.on('load', setup);
    map.on('style.load', setup);

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [mapboxToken, onMapLoad]);

  return (
    <div className="h-[calc(100vh-200px)] rounded-lg overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};