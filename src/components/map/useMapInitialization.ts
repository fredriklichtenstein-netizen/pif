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
        console.log("🗺️ [Map Init] Using stored map state:", state);
        return state;
      }
    }
  } catch (error) {
    console.error('🚨 [Map Init] Error reading stored map state:', error);
  }
  console.log("🗺️ [Map Init] Using default map state");
  return { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM };
};

export const saveMapState = (center: [number, number], zoom: number) => {
  try {
    localStorage.setItem(MAP_STATE_KEY, JSON.stringify({ center, zoom }));
    console.log("💾 [Map Init] Saved map state:", { center, zoom });
  } catch (error) {
    console.error('🚨 [Map Init] Error saving map state:', error);
  }
};

export const useMapInitialization = (mapboxToken: string) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const initializationAttempt = useRef(0);
  const isInitializing = useRef(false);
  const isMapReadyRef = useRef(false);

  // Keep isMapReadyRef in sync with state
  useEffect(() => {
    isMapReadyRef.current = isMapReady;
  }, [isMapReady]);

  const initializeMap = useCallback(() => {
    console.log("🚀 [Map Init] Starting map initialization...");
    
    // Prevent multiple simultaneous initialization attempts
    if (isInitializing.current) {
      console.log("⏸️ [Map Init] Initialization already in progress, skipping");
      return;
    }
    
    isInitializing.current = true;
    
    // Cleanup existing map instance if it exists
    if (map.current) {
      try {
        console.log("🧹 [Map Init] Cleaning up existing map instance");
        map.current.remove();
        map.current = null;
      } catch (e) {
        console.error("🚨 [Map Init] Error cleaning up existing map:", e);
      }
    }
    
    setIsMapReady(false);
    setError(null);
    
    if (!mapContainer.current) {
      console.error("🚨 [Map Init] No map container ref available");
      setError(new Error("Map container not available"));
      isInitializing.current = false;
      return;
    }
    
    if (!mapboxToken) {
      console.error("🚨 [Map Init] No Mapbox token available");
      setError(new Error("No Mapbox token available"));
      isInitializing.current = false;
      return;
    }
    
    initializationAttempt.current += 1;
    console.log(`🎯 [Map Init] Attempt ${initializationAttempt.current} - Token: ${mapboxToken.substring(0, 10)}...`);
    
    try {
      // Check WebGL support
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        throw new Error("WebGL is not supported in this browser");
      }
      console.log("✅ [Map Init] WebGL support confirmed");
      
      // Set access token
      mapboxgl.accessToken = mapboxToken;
      console.log("🔑 [Map Init] Mapbox access token set");
      
      const initialState = getInitialMapState();
      console.log("📍 [Map Init] Initial state:", initialState);
      
      // Create the map instance with enhanced error handling
      console.log("🏗️ [Map Init] Creating map instance...");
      const newMap = new mapboxgl.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/streets-v12",
        center: initialState.center,
        zoom: initialState.zoom,
        minZoom: 9,
        maxZoom: 16,
        attributionControl: false,
        preserveDrawingBuffer: false,
        renderWorldCopies: false,
        antialias: true,
        failIfMajorPerformanceCaveat: false,
      });

      console.log("🗺️ [Map Init] Map instance created successfully");

      // Enhanced event listeners with detailed logging
      newMap.on('styledata', () => {
        console.log("🎨 [Map Init] Style data loaded");
      });

      newMap.on('sourcedata', (e) => {
        if (e.sourceDataType === 'visibility') {
          console.log("👁️ [Map Init] Source visibility changed");
        }
      });

      newMap.on('load', () => {
        console.log("🎉 [Map Init] Map load event fired");
        
        // Add controls
        console.log("🎛️ [Map Init] Adding navigation controls...");
        newMap.addControl(new mapboxgl.NavigationControl(), "top-right");
        newMap.addControl(
          new mapboxgl.ScaleControl({
            maxWidth: 150,
            unit: 'metric'
          }),
          'bottom-left'
        );
        
        // Final style check
        if (!newMap.isStyleLoaded()) {
          console.log("⏳ [Map Init] Style not fully loaded, waiting for idle...");
          const checkStyleLoaded = () => {
            if (newMap.isStyleLoaded()) {
              console.log("✅ [Map Init] Style now fully loaded on idle");
              setIsMapReady(true);
              isInitializing.current = false;
              newMap.off('idle', checkStyleLoaded);
            } else {
              console.log("⏳ [Map Init] Still waiting for style to load...");
            }
          };
          newMap.on('idle', checkStyleLoaded);
          
          // Fallback timeout - use ref to get current state
          setTimeout(() => {
            if (!isMapReadyRef.current) {
              console.log("⚠️ [Map Init] Timeout reached, forcing map ready state");
              setIsMapReady(true);
              isInitializing.current = false;
              newMap.off('idle', checkStyleLoaded);
            }
          }, 10000);
        } else {
          console.log("✅ [Map Init] Style already loaded, map ready");
          setIsMapReady(true);
          isInitializing.current = false;
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
        console.error('🚨 [Map Init] Map error event:', e);
        setError(new Error(`Map error: ${e.error?.message || 'Unknown error'}`));
        setIsMapReady(false);
        isInitializing.current = false;
      });

      // Additional debugging events
      newMap.on('dataloading', (e) => {
        console.log("📥 [Map Init] Data loading:", 'sourceDataType' in e ? e.sourceDataType : 'style');
      });

      newMap.on('data', (e) => {
        console.log("📦 [Map Init] Data loaded:", 'sourceDataType' in e ? e.sourceDataType : 'style');
      });

    } catch (error) {
      console.error('🚨 [Map Init] Error during map creation:', error);
      setError(error instanceof Error ? error : new Error("Failed to initialize map"));
      setIsMapReady(false);
      isInitializing.current = false;
    }
  }, [mapboxToken]); // Only depend on mapboxToken, not on isMapReady

  useEffect(() => {
    if (mapboxToken && !isInitializing.current) {
      console.log("🔄 [Map Init] Token received, initializing map...");
      initializeMap();
    } else if (!mapboxToken) {
      console.log("⏳ [Map Init] Waiting for token...");
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
          console.error('🚨 [Map Init] Error saving final map state:', error);
        }
        
        console.log("🗑️ [Map Init] Cleaning up map instance");
        map.current.remove();
        map.current = null;
        setIsMapReady(false);
        isInitializing.current = false;
      }
    };
  }, [mapboxToken, initializeMap]);

  const retryInitialization = useCallback(() => {
    console.log("🔄 [Map Init] Manual retry requested");
    isInitializing.current = false; // Reset initialization guard
    initializeMap();
  }, [initializeMap]);

  return { mapContainer, map: map.current, isMapReady, error, retryInitialization };
};
