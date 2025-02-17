
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

export const useMapInitialization = (mapboxToken: string) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;
    
    const initializeMap = () => {
      try {
        mapboxgl.accessToken = mapboxToken;
        
        const newMap = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/light-v11",
          center: [18.0649, 59.3293], // Stockholm coordinates
          zoom: 14,
          minZoom: 9,
          maxZoom: 16,
          attributionControl: false,
          preserveDrawingBuffer: false,
          renderWorldCopies: false,
          antialias: true,
        });

        newMap.on('load', () => {
          // Add controls only after the map is fully loaded
          newMap.addControl(new mapboxgl.NavigationControl(), "top-right");
          newMap.addControl(
            new mapboxgl.ScaleControl({
              maxWidth: 150,
              unit: 'metric'
            }),
            'bottom-left'
          );
          
          map.current = newMap;
          setIsMapReady(true);
        });

        newMap.on('error', (e) => {
          console.error('Map error:', e);
          setIsMapReady(false);
        });

      } catch (error) {
        console.error('Error initializing map:', error);
        setIsMapReady(false);
      }
    };

    initializeMap();

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
