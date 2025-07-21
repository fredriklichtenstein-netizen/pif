
import type { Post } from "@/types/post";
import { useMapInitialization } from "./useMapInitialization";
import { MapMarkersLayer } from "./MapMarkersLayer";
import { Button } from "@/components/ui/button";
import { Locate, AlertCircle, RefreshCw } from "lucide-react";
import { useEffect, useState, memo } from "react";
import { useLocationTracking } from "./useLocationTracking";

interface MapContainerProps {
  mapboxToken: string;
  posts: Post[];
  onPostClick: (postId: string) => void;
  targetItemId?: string | null;
}

export const MapContainer = memo(({ mapboxToken, posts, onPostClick, targetItemId }: MapContainerProps) => {
  const { mapContainer, map, isMapReady, error, retryInitialization } = useMapInitialization(mapboxToken);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const locationTracking = useLocationTracking(isMapReady ? map : null);

  useEffect(() => {
    if (isMapReady && map) {
      console.log("Map is ready, making it visible");
      const timer = setTimeout(() => {
        setIsMapVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isMapReady, map]);

  // Handle target item centering
  useEffect(() => {
    if (!isMapReady || !map || !targetItemId || !posts.length) return;
    
    console.log("Attempting to center on target item:", targetItemId);
    console.log("Available posts:", posts.map(p => ({ id: p.id, coords: p.coordinates })));
    
    const targetPost = posts.find(post => post.id === targetItemId);
    
    if (!targetPost) {
      console.log("Target post not found:", targetItemId);
      return;
    }
    
    if (!targetPost.coordinates) {
      console.log("Target post has no coordinates:", targetItemId);
      return;
    }
    
    const { lng, lat } = targetPost.coordinates;
    
    if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
      console.error("Invalid coordinates for target post:", { lng, lat });
      return;
    }
    
    console.log("Centering map on target coordinates:", { lng, lat });
    
    try {
      map.flyTo({
        center: [lng, lat],
        zoom: 15,
        duration: 1500
      });
      console.log("Successfully initiated flyTo for target item");
    } catch (error) {
      console.error("Error during flyTo:", error);
    }
  }, [isMapReady, map, targetItemId, posts]);

  return (
    <div className="h-full w-full relative">
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ 
          opacity: isMapVisible ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="text-center p-6">
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
      
      {!isMapReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing map...</p>
          </div>
        </div>
      )}
      
      {isMapReady && !error && map && (
        <>
          <MapMarkersLayer 
            map={map}
            posts={posts}
            onPostClick={onPostClick}
            targetItemId={targetItemId}
          />
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
        </>
      )}
    </div>
  );
});

MapContainer.displayName = "MapContainer";
