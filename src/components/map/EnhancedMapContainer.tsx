
import { memo } from "react";
import type { Post } from "@/types/post";
import { useEnhancedMapInitialization } from "./useEnhancedMapInitialization";
import { useMarkerProcessor } from "./useMarkerProcessor";
import { Button } from "@/components/ui/button";
import { Locate, AlertCircle, RefreshCw } from "lucide-react";
import { useLocationTracking } from "./useLocationTracking";
import { useMapLoading } from "@/hooks/map/useMapLoadingState";

interface EnhancedMapContainerProps {
  mapboxToken: string;
  posts: Post[];
  onPostClick: (postId: string) => void;
}

export const EnhancedMapContainer = memo(({ mapboxToken, posts, onPostClick }: EnhancedMapContainerProps) => {
  // Use our enhanced map initialization hook
  const { mapContainer, map, isMapReady, retryInitialization } = useEnhancedMapInitialization(mapboxToken);
  
  // Use the location tracking hook (no change needed here)
  const locationTracking = useLocationTracking(isMapReady ? map : null);
  
  // Use our marker processor
  const { markersCount, processedCount } = useMarkerProcessor({
    posts,
    map: isMapReady ? map : null,
    onPostClick
  });
  
  // Use centralized loading state
  const { isLoading, error, message, phase, progress, isMarkersProcessing } = useMapLoading();
  
  return (
    <div className="h-full w-full relative">
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ 
          opacity: isMapReady && !isLoading ? 1 : 0.4,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90 z-10">
          <div className="text-center p-6 max-w-md">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-gray-700 mb-2 font-medium">Error initializing map</p>
            <p className="text-gray-500 text-sm mb-6">{error.message}</p>
            <Button 
              onClick={retryInitialization} 
              className="flex items-center gap-2"
              variant="default"
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          </div>
        </div>
      )}
      
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-80 z-10">
          <div className="text-center p-6 max-w-md">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              {progress > 0 && isMarkersProcessing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">{progress}%</span>
                </div>
              )}
            </div>
            <p className="text-gray-700 mb-1 font-medium">{message}</p>
            {isMarkersProcessing && (
              <p className="text-gray-500 text-xs">
                Processing {processedCount} of {posts.length} locations
              </p>
            )}
          </div>
        </div>
      )}
      
      {isMapReady && !error && map && (
        <Button
          onClick={locationTracking.toggleLocationTracking}
          className="absolute bottom-4 right-4 bg-white hover:bg-gray-100 text-gray-800 cursor-pointer"
          size="icon"
          variant="outline"
        >
          <Locate 
            className={`h-4 w-4 ${locationTracking.isTracking ? 'text-blue-500 fill-blue-500' : ''}`} 
            strokeWidth={1.5}
          />
        </Button>
      )}
      
      {/* Stats display for debugging - can be removed in production */}
      {process.env.NODE_ENV === 'development' && isMapReady && (
        <div className="absolute top-2 left-2 bg-white bg-opacity-80 p-2 rounded text-xs z-10">
          <div>Markers: {markersCount}</div>
          <div>Processed: {processedCount}</div>
          <div>Total posts: {posts.length}</div>
        </div>
      )}
    </div>
  );
});

EnhancedMapContainer.displayName = "EnhancedMapContainer";
