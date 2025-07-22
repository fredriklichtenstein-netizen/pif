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

// Enhanced browser capability checks
const checkBrowserCapabilities = () => {
  const results = {
    webgl: false,
    canvas: false,
    webglVersion: '',
    userAgent: navigator.userAgent
  };

  // Check Canvas support
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    results.canvas = !!ctx;
    console.log("🖼️ [Map Init] Canvas support:", results.canvas);
  } catch (e) {
    console.error("🚨 [Map Init] Canvas check failed:", e);
  }

  // Check WebGL support with detailed version info
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      results.webgl = true;
      const webglContext = gl as WebGLRenderingContext;
      const debugInfo = webglContext.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        results.webglVersion = webglContext.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
      console.log("🎮 [Map Init] WebGL support confirmed:", results.webglVersion || 'Basic WebGL');
    } else {
      console.error("🚨 [Map Init] No WebGL support detected");
    }
  } catch (e) {
    console.error("🚨 [Map Init] WebGL check failed:", e);
  }

  return results;
};

// Network connectivity check
const checkNetworkConnectivity = async (): Promise<boolean> => {
  try {
    console.log("🌐 [Map Init] Checking network connectivity...");
    const response = await fetch('https://api.mapbox.com/v1/ping', {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-cache'
    });
    console.log("✅ [Map Init] Network connectivity confirmed");
    return true;
  } catch (error) {
    console.error("🚨 [Map Init] Network connectivity check failed:", error);
    return false;
  }
};

// Container validation
const validateContainer = (container: HTMLDivElement): boolean => {
  const rect = container.getBoundingClientRect();
  const computed = window.getComputedStyle(container);
  
  console.log("📐 [Map Init] Container validation:", {
    width: rect.width,
    height: rect.height,
    display: computed.display,
    visibility: computed.visibility,
    position: computed.position
  });

  const isValid = rect.width > 0 && rect.height > 0 && computed.visibility !== 'hidden';
  
  if (!isValid) {
    console.error("🚨 [Map Init] Invalid container dimensions or visibility");
  }
  
  return isValid;
};

export const useMapInitialization = (mapboxToken: string) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const initializationAttempt = useRef(0);
  const isInitializing = useRef(false);
  const isMapReadyRef = useRef(false);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep isMapReadyRef in sync with state
  useEffect(() => {
    isMapReadyRef.current = isMapReady;
  }, [isMapReady]);

  const initializeMap = useCallback(async () => {
    console.log("🚀 [Map Init] Starting enhanced map initialization...");
    
    // Prevent multiple simultaneous initialization attempts
    if (isInitializing.current) {
      console.log("⏸️ [Map Init] Initialization already in progress, skipping");
      return;
    }
    
    isInitializing.current = true;
    
    // Clear any existing timeout
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }
    
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

    // Enhanced pre-initialization checks
    initializationAttempt.current += 1;
    console.log(`🎯 [Map Init] Attempt ${initializationAttempt.current} - Enhanced diagnostics starting...`);
    
    // Check browser capabilities
    const capabilities = checkBrowserCapabilities();
    if (!capabilities.webgl || !capabilities.canvas) {
      const errorMsg = `Browser capabilities insufficient - WebGL: ${capabilities.webgl}, Canvas: ${capabilities.canvas}`;
      console.error("🚨 [Map Init]", errorMsg);
      setError(new Error(errorMsg));
      isInitializing.current = false;
      return;
    }

    // Validate container
    if (!validateContainer(mapContainer.current)) {
      setError(new Error("Map container has invalid dimensions or visibility"));
      isInitializing.current = false;
      return;
    }

    // Check network connectivity
    const hasNetwork = await checkNetworkConnectivity();
    if (!hasNetwork) {
      console.warn("⚠️ [Map Init] Network connectivity issues detected, proceeding anyway...");
    }

    try {
      // Set access token
      mapboxgl.accessToken = mapboxToken;
      console.log("🔑 [Map Init] Mapbox access token set, version:", mapboxgl.version);
      
      const initialState = getInitialMapState();
      console.log("📍 [Map Init] Initial state:", initialState);
      
      // Enhanced map configuration with fallback style
      console.log("🏗️ [Map Init] Creating map instance with enhanced config...");
      const mapConfig = {
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/streets-v11", // Changed to more stable v11
        center: initialState.center,
        zoom: initialState.zoom,
        minZoom: 9,
        maxZoom: 16,
        attributionControl: false,
        preserveDrawingBuffer: false,
        renderWorldCopies: false,
        antialias: true,
        failIfMajorPerformanceCaveat: false,
        optimizeForTerrain: false, // Disable terrain optimization
        trackResize: true
      };

      console.log("🗺️ [Map Init] Map config:", mapConfig);
      const newMap = new mapboxgl.Map(mapConfig);

      console.log("🗺️ [Map Init] Map instance created successfully");

      // Progressive timeout system instead of single timeout
      const createProgressiveTimeout = (phase: string, delay: number) => {
        return setTimeout(() => {
          if (!isMapReadyRef.current && isInitializing.current) {
            console.log(`⚠️ [Map Init] ${phase} timeout (${delay}ms) reached, checking state...`);
            if (newMap && newMap.isStyleLoaded && newMap.isStyleLoaded()) {
              console.log("✅ [Map Init] Style actually loaded, forcing ready state");
              setIsMapReady(true);
              isInitializing.current = false;
            } else if (delay >= 15000) {
              console.log("🚨 [Map Init] Final timeout reached, forcing ready with warning");
              setIsMapReady(true);
              isInitializing.current = false;
            }
          }
        }, delay);
      };

      // Enhanced event listeners with detailed logging
      newMap.on('styledata', (e) => {
        console.log("🎨 [Map Init] Style data event:", e);
      });

      newMap.on('sourcedata', (e) => {
        console.log("📦 [Map Init] Source data event:", e.sourceDataType || 'unknown');
      });

      newMap.on('data', (e) => {
        console.log("📥 [Map Init] Data event:", e);
      });

      newMap.on('idle', () => {
        console.log("😴 [Map Init] Map idle event - checking readiness...");
        if (newMap.isStyleLoaded()) {
          console.log("✅ [Map Init] Map is idle and style is loaded");
          if (!isMapReadyRef.current) {
            setIsMapReady(true);
            isInitializing.current = false;
          }
        }
      });

      newMap.on('load', () => {
        console.log("🎉 [Map Init] Map load event fired");
        
        try {
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
          
          console.log("🔍 [Map Init] Checking style load status...");
          
          if (!newMap.isStyleLoaded()) {
            console.log("⏳ [Map Init] Style not fully loaded, waiting for style load...");
            
            // Set up progressive timeouts
            createProgressiveTimeout("First check", 2000);
            createProgressiveTimeout("Second check", 5000);
            createProgressiveTimeout("Third check", 10000);
            createProgressiveTimeout("Final check", 15000);
            
          } else {
            console.log("✅ [Map Init] Style already loaded, map ready immediately");
            setIsMapReady(true);
            isInitializing.current = false;
          }
          
          map.current = newMap;
          
        } catch (controlError) {
          console.error("🚨 [Map Init] Error adding controls:", controlError);
          // Continue anyway, controls are not critical
          setIsMapReady(true);
          isInitializing.current = false;
          map.current = newMap;
        }
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
        const errorMessage = e.error?.message || 'Unknown map error';
        setError(new Error(`Map error: ${errorMessage}`));
        setIsMapReady(false);
        isInitializing.current = false;
      });

      newMap.on('webglcontextlost', () => {
        console.error('🚨 [Map Init] WebGL context lost');
        setError(new Error('WebGL context lost - please refresh the page'));
        isInitializing.current = false;
      });

    } catch (error) {
      console.error('🚨 [Map Init] Error during map creation:', error);
      setError(error instanceof Error ? error : new Error("Failed to initialize map"));
      setIsMapReady(false);
      isInitializing.current = false;
    }
  }, [mapboxToken]);

  useEffect(() => {
    if (mapboxToken && !isInitializing.current) {
      console.log("🔄 [Map Init] Token received, initializing map...");
      initializeMap();
    } else if (!mapboxToken) {
      console.log("⏳ [Map Init] Waiting for token...");
    }

    return () => {
      // Clear timeout on cleanup
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      
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
