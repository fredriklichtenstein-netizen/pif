
import { create } from "zustand";

// Enum to track distinct loading phases
export enum MapLoadingPhase {
  IDLE = "idle",
  TOKEN_LOADING = "token_loading",
  MAP_INITIALIZING = "map_initializing",
  POSTS_LOADING = "posts_loading",
  MARKERS_PROCESSING = "markers_processing",
  COMPLETE = "complete",
  ERROR = "error"
}

// Types for our loading state store
interface MapLoadingState {
  phase: MapLoadingPhase;
  progress: number; // 0-100 percentage
  error: Error | null;
  isLoading: boolean;
  message: string;
  
  // Actions
  setPhase: (phase: MapLoadingPhase, message?: string) => void;
  setProgress: (progress: number) => void;
  setError: (error: Error | null) => void;
  reset: () => void;
}

// Default message for each phase
const defaultMessages: Record<MapLoadingPhase, string> = {
  [MapLoadingPhase.IDLE]: "Ready to load map",
  [MapLoadingPhase.TOKEN_LOADING]: "Retrieving map credentials...",
  [MapLoadingPhase.MAP_INITIALIZING]: "Initializing map...",
  [MapLoadingPhase.POSTS_LOADING]: "Loading items data...",
  [MapLoadingPhase.MARKERS_PROCESSING]: "Processing location data...",
  [MapLoadingPhase.COMPLETE]: "Map loaded successfully",
  [MapLoadingPhase.ERROR]: "An error occurred"
};

// Create the store with Zustand
export const useMapLoadingState = create<MapLoadingState>((set) => ({
  phase: MapLoadingPhase.IDLE,
  progress: 0,
  error: null,
  isLoading: false,
  message: defaultMessages[MapLoadingPhase.IDLE],
  
  setPhase: (phase, message) => set(() => ({ 
    phase, 
    message: message || defaultMessages[phase],
    isLoading: phase !== MapLoadingPhase.COMPLETE && phase !== MapLoadingPhase.ERROR && phase !== MapLoadingPhase.IDLE,
    // Reset error when moving to a non-error phase
    ...(phase !== MapLoadingPhase.ERROR && { error: null }),
    // Reset progress when changing phases
    progress: 0
  })),
  
  setProgress: (progress) => set(() => ({ progress })),
  
  setError: (error) => set(() => ({ 
    error, 
    phase: MapLoadingPhase.ERROR,
    message: error?.message || defaultMessages[MapLoadingPhase.ERROR],
    isLoading: false
  })),
  
  reset: () => set(() => ({ 
    phase: MapLoadingPhase.IDLE, 
    progress: 0, 
    error: null,
    isLoading: false,
    message: defaultMessages[MapLoadingPhase.IDLE]
  }))
}));

// Hook to use parts of the loading state specifically for UI components
export const useMapLoading = () => {
  const { phase, progress, error, isLoading, message } = useMapLoadingState();
  
  return {
    phase,
    progress,
    error,
    isLoading,
    message,
    isTokenLoading: phase === MapLoadingPhase.TOKEN_LOADING,
    isMapInitializing: phase === MapLoadingPhase.MAP_INITIALIZING,
    isPostsLoading: phase === MapLoadingPhase.POSTS_LOADING,
    isMarkersProcessing: phase === MapLoadingPhase.MARKERS_PROCESSING,
    isComplete: phase === MapLoadingPhase.COMPLETE,
    isError: phase === MapLoadingPhase.ERROR,
  };
};
