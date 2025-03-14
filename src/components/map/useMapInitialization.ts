
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

const MAP_STATE_KEY = 'map_last_state';

interface MapState {
  center: [number, number];
  zoom: number;
}

const DEFAULT_CENTER: [number, number] = [18.0649, 59.3293]; // Stockholm coordinates
const DEFAULT_ZOOM = 14;

// Move getInitialMapState outside the hook so it can be used by other components
export const getInitialMapState = (): MapState => {
  try {
    const stored = localStorage.getItem(MAP_STATE_KEY);
    if (stored) {
      const state = JSON.parse(stored);
      if (Array.isArray(state.center) && state.center.length === 2 && 
          typeof state.zoom === 'number') {
        return state;
      }
    }
  } catch (error) {
    console.error('Error reading stored map state:', error);
  }
  return { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM };
};

export const saveMapState = (center: [number, number], zoom: number) => {
  try {
    localStorage.setItem(MAP_STATE_KEY, JSON.stringify({ center, zoom }));
  } catch (error) {
    console.error('Error saving map state:', error);
  }
};

export const useMapInitialization = (mapboxToken: string) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;
    
    const initializeMap = () => {
      try {
        mapboxgl.accessToken = mapboxToken;
        const initialState = getInitialMapState();
        
        const newMap = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/light-v11",
          center: initialState.center,
          zoom: initialState.zoom,
          minZoom: 9,
          maxZoom: 16,
          attributionControl: false,
          preserveDrawingBuffer: false,
          renderWorldCopies: false,
          antialias: true,
        });

        newMap.on('load', () => {
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

        // Save map state when user moves or zooms
        newMap.on('moveend', () => {
          if (!newMap || !newMap.getCenter()) return;
          saveMapState(
            [newMap.getCenter().lng, newMap.getCenter().lat],
            newMap.getZoom()
          );
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
        // Save final state before unmounting
        try {
          saveMapState(
            [map.current.getCenter().lng, map.current.getCenter().lat],
            map.current.getZoom()
          );
        } catch (error) {
          console.error('Error saving final map state:', error);
        }
        
        map.current.remove();
        map.current = null;
        setIsMapReady(false);
      }
    };
  }, [mapboxToken]);

  return { mapContainer, map: map.current, isMapReady };
};
