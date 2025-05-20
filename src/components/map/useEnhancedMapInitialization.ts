
import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapLoadingState, MapLoadingPhase } from "@/hooks/map/useMapLoadingState";

const MAP_STATE_KEY = 'map_last_state';

interface MapState {
  center: [number, number];
  zoom: number;
}

const DEFAULT_CENTER: [number, number] = [18.0649, 59.3293]; // Stockholm coordinates
const DEFAULT_ZOOM = 14;

// Get initial map state from localStorage if available
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

// Save map state to localStorage
export const saveMapState = (center: [number, number], zoom: number) => {
  try {
    localStorage.setItem(MAP_STATE_KEY, JSON.stringify({ center, zoom }));
  } catch (error) {
    console.error('Error saving map state:', error);
  }
};

export const useEnhancedMapInitialization = (mapboxToken: string) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isStyleLoaded, setStyleLoaded] = useState(false);
  const initializationAttempt = useRef(0);
  const styleLoadTimeout = useRef<number | null>(null);
  const { setPhase, setError } = useMapLoadingState();

  // Create a check for map style loading with timeout
  const checkStyleLoaded = useCallback((newMap: mapboxgl.Map) => {
    // Clear any existing timeout
    if (styleLoadTimeout.current) {
      window.clearTimeout(styleLoadTimeout.current);
    }

    // If the style is already loaded, we're good
    if (newMap.isStyleLoaded()) {
      setStyleLoaded(true);
      return;
    }

    // Set a timeout for style loading
    styleLoadTimeout.current = window.setTimeout(() => {
      // If we reach the timeout and style still isn't loaded, force a re-render
      if (!newMap.isStyleLoaded()) {
        console.warn("Map style loading timeout reached, forcing a re-render");
        newMap.once('styledata', () => {
          setStyleLoaded(true);
        });
        newMap.setStyle(newMap.getStyle());
      }
    }, 5000); // 5 second timeout

    // Set up event listener for when style loads
    newMap.once('styledata', () => {
      if (styleLoadTimeout.current) {
        window.clearTimeout(styleLoadTimeout.current);
        styleLoadTimeout.current = null;
      }
      
      // Check that all layers are actually loaded
      if (newMap.isStyleLoaded()) {
        setStyleLoaded(true);
      } else {
        // If still not loaded, set another check
        setTimeout(() => {
          if (newMap && !map.current?._removed) { // Fixed: using _removed instead of isRemoved
            setStyleLoaded(newMap.isStyleLoaded());
          }
        }, 500);
      }
    });
  }, []);

  const initializeMap = useCallback(() => {
    // Update loading state to initializing
    setPhase(MapLoadingPhase.MAP_INITIALIZING);
    
    // Cleanup existing map instance if it exists
    if (map.current) {
      try {
        map.current.remove();
        map.current = null;
      } catch (e) {
        console.error("Error cleaning up existing map:", e);
      }
    }
    
    setStyleLoaded(false);
    
    if (!mapContainer.current || !mapboxToken) {
      if (!mapboxToken) {
        setError(new Error("No Mapbox token available"));
      }
      return;
    }
    
    initializationAttempt.current += 1;
    console.log(`Starting map initialization attempt ${initializationAttempt.current} with token:`, 
      mapboxToken ? "Token exists" : "No token");
    
    try {
      if (!mapboxToken) {
        throw new Error("No Mapbox token available");
      }
      
      // Set access token
      mapboxgl.accessToken = mapboxToken;
      
      const initialState = getInitialMapState();
      
      // Create the map instance with more stable style
      const newMap = new mapboxgl.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/streets-v12", // Using streets-v12 for more consistent layer naming
        center: initialState.center,
        zoom: initialState.zoom,
        minZoom: 9,
        maxZoom: 16,
        attributionControl: false,
        preserveDrawingBuffer: false,
        renderWorldCopies: false,
        antialias: true,
        failIfMajorPerformanceCaveat: false, // Don't fail on lower-end devices
        trackResize: true,
        cooperativeGestures: true, // Enable cooperative gestures to prevent page scrolling while interacting with map
      });

      console.log("Map instance created");

      // Set up event listeners
      newMap.on('load', () => {
        console.log("Map load event fired");
        
        // Add controls
        newMap.addControl(new mapboxgl.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: false
        }), "top-right");
        
        newMap.addControl(
          new mapboxgl.ScaleControl({
            maxWidth: 150,
            unit: 'metric'
          }),
          'bottom-left'
        );
        
        // Check style loading
        checkStyleLoaded(newMap);
      });

      // Save map state when user moves or zooms
      newMap.on('moveend', () => {
        if (!newMap || !newMap.getCenter()) return;
        saveMapState(
          [newMap.getCenter().lng, newMap.getCenter().lat],
          newMap.getZoom()
        );
      });

      // Error handling
      newMap.on('error', (e) => {
        console.error('Map error:', e);
        setError(new Error(`Map error: ${e.error?.message || 'Unknown error'}`));
        setStyleLoaded(false);
      });

      map.current = newMap;
    } catch (error) {
      console.error('Error initializing map:', error);
      setError(error instanceof Error ? error : new Error("Failed to initialize map"));
      setStyleLoaded(false);
    }
  }, [mapboxToken, checkStyleLoaded, setPhase, setError]);

  // Initialize the map when token is available
  useEffect(() => {
    if (mapboxToken) {
      initializeMap();
    }

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
        setStyleLoaded(false);
      }
      
      // Clear any pending timeouts
      if (styleLoadTimeout.current) {
        window.clearTimeout(styleLoadTimeout.current);
        styleLoadTimeout.current = null;
      }
    };
  }, [mapboxToken, initializeMap]);

  // Retry initialization
  const retryInitialization = useCallback(() => {
    console.log("Retrying map initialization");
    initializeMap();
  }, [initializeMap]);

  return { 
    mapContainer, 
    map: map.current, 
    isMapReady: isStyleLoaded, 
    retryInitialization 
  };
};
