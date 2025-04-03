
import { useEffect, useRef, useState, useCallback } from "react";
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
  const [error, setError] = useState<Error | null>(null);
  const initializationAttempt = useRef(0);

  const initializeMap = useCallback(() => {
    // Cleanup existing map instance if it exists
    if (map.current) {
      try {
        map.current.remove();
        map.current = null;
      } catch (e) {
        console.error("Error cleaning up existing map:", e);
      }
    }
    
    setIsMapReady(false);
    setError(null);
    
    if (!mapContainer.current || !mapboxToken) {
      if (!mapboxToken) {
        setError(new Error("No Mapbox token available"));
      }
      return;
    }
    
    initializationAttempt.current += 1;
    console.log(`Starting map initialization attempt ${initializationAttempt.current} with token:`, mapboxToken ? "Token exists" : "No token");
    
    try {
      if (!mapboxToken) {
        throw new Error("No Mapbox token available");
      }
      
      // Set access token
      mapboxgl.accessToken = mapboxToken;
      console.log("Mapbox access token set");
      
      const initialState = getInitialMapState();
      console.log("Using initial map state:", initialState);
      
      // Create the map instance with more stable style
      const newMap = new mapboxgl.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/streets-v12", // Using streets-v12 which has more consistent layer naming
        center: initialState.center,
        zoom: initialState.zoom,
        minZoom: 9,
        maxZoom: 16,
        attributionControl: false,
        preserveDrawingBuffer: false,
        renderWorldCopies: false,
        antialias: true,
        failIfMajorPerformanceCaveat: false, // Don't fail on lower-end devices
      });

      console.log("Map instance created");

      // Set up event listeners
      newMap.on('load', () => {
        console.log("Map load event fired");
        
        newMap.addControl(new mapboxgl.NavigationControl(), "top-right");
        newMap.addControl(
          new mapboxgl.ScaleControl({
            maxWidth: 150,
            unit: 'metric'
          }),
          'bottom-left'
        );
        
        // Check that the style is fully loaded
        if (!newMap.isStyleLoaded()) {
          console.log("Style not fully loaded, waiting...");
          const checkStyleLoaded = () => {
            if (newMap.isStyleLoaded()) {
              console.log("Style now fully loaded");
              setIsMapReady(true);
              newMap.off('idle', checkStyleLoaded);
            }
          };
          newMap.on('idle', checkStyleLoaded);
        } else {
          console.log("Map controls added");
          setIsMapReady(true);
        }
        
        map.current = newMap;
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
        setError(new Error(`Map error: ${e.error?.message || 'Unknown error'}`));
        setIsMapReady(false);
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      setError(error instanceof Error ? error : new Error("Failed to initialize map"));
      setIsMapReady(false);
    }
  }, [mapboxToken]);

  useEffect(() => {
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
        
        console.log("Removing map instance");
        map.current.remove();
        map.current = null;
        setIsMapReady(false);
      }
    };
  }, [mapboxToken, initializeMap]);

  const retryInitialization = useCallback(() => {
    console.log("Retrying map initialization");
    initializeMap();
  }, [initializeMap]);

  return { mapContainer, map: map.current, isMapReady, error, retryInitialization };
};
