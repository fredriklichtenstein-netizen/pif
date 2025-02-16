
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

export const useMapInitialization = (mapboxToken: string) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;
    
    mapboxgl.accessToken = mapboxToken;
    
    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [0, 0], // This will be immediately updated with user location
      zoom: 14, // Default zoom level showing ~1km radius
      minZoom: 9,
      maxZoom: 16
    });

    newMap.addControl(new mapboxgl.NavigationControl(), "top-right");

    const checkIfReady = () => {
      if (newMap.loaded() && newMap.isStyleLoaded()) {
        console.log("Map is fully ready");
        map.current = newMap;
        setIsMapReady(true);
      }
    };

    newMap.on('load', checkIfReady);
    newMap.on('style.load', checkIfReady);

    return () => {
      newMap.remove();
      map.current = null;
      setIsMapReady(false);
    };
  }, [mapboxToken]);

  return { mapContainer, map: map.current, isMapReady };
};
