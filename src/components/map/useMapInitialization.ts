
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

export const useMapInitialization = (mapboxToken: string) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;
    
    const preloadResources = async () => {
      mapboxgl.accessToken = mapboxToken;
      
      const newMap = new mapboxgl.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/light-v11",
        center: [0, 0],
        zoom: 14,
        minZoom: 9,
        maxZoom: 16,
        fadeDuration: 0,
        attributionControl: false,
        preserveDrawingBuffer: false,
        renderWorldCopies: false,
        antialias: true,
        optimizeForTerrain: true,
        transformRequest: (url, resourceType) => {
          return {
            url: url,
            credentials: 'same-origin'
          };
        }
      });

      // Wait for style and essential resources to load
      await new Promise<void>((resolve) => {
        newMap.once('styledata', () => {
          newMap.once('idle', () => {
            // Add controls only after the map is fully loaded
            newMap.addControl(new mapboxgl.NavigationControl(), "top-right");
            newMap.addControl(
              new mapboxgl.ScaleControl({
                maxWidth: 150,
                unit: 'metric'
              }),
              'bottom-left'
            );
            resolve();
          });
        });
      });

      map.current = newMap;
      setIsMapReady(true);
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
