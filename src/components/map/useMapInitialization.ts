
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

export const useMapInitialization = (mapboxToken: string) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;
    
    // Pre-load necessary resources
    const preloadResources = async () => {
      // Pre-initialize mapbox
      mapboxgl.accessToken = mapboxToken;
      
      // Create map instance with optimized initial settings
      const newMap = new mapboxgl.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/light-v11",
        center: [0, 0],
        zoom: 14,
        minZoom: 9,
        maxZoom: 16,
        attributionControl: false, // We'll add this later
        preserveDrawingBuffer: false, // Optimization for performance
        antialias: false // Disable antialiasing for initial load
      });

      // Add controls after initial load
      newMap.once('load', () => {
        // Add navigation controls
        newMap.addControl(new mapboxgl.NavigationControl(), "top-right");
        
        // Add scale control
        newMap.addControl(
          new mapboxgl.ScaleControl({
            maxWidth: 150,
            unit: 'metric'
          }),
          'bottom-left'
        );

        // Enable antialiasing after initial load
        newMap.setLayoutProperty('background', 'visibility', 'visible');
        
        map.current = newMap;
        setIsMapReady(true);
        console.log("Map fully initialized and ready");
      });
    };

    preloadResources().catch(console.error);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        setIsMapReady(false);
      }
    };
  }, [mapboxToken]);

  return { mapContainer, map: map.current, isMapReady };
};
