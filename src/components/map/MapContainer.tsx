
import type { Post } from "@/types/post";
import { useMapInitialization } from "./useMapInitialization";
import { MapMarkersLayer } from "./MapMarkersLayer";
import { Button } from "@/components/ui/button";
import { Locate } from "lucide-react";
import { useEffect, useState, memo } from "react";
import { useLocationTracking } from "./useLocationTracking";
import { Toaster } from "@/components/ui/toaster";

interface MapContainerProps {
  mapboxToken: string;
  posts: Post[];
  onPostClick: (postId: string) => void;
}

export const MapContainer = memo(({ mapboxToken, posts, onPostClick }: MapContainerProps) => {
  const { mapContainer, map, isMapReady } = useMapInitialization(mapboxToken);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const { isTracking, toggleLocationTracking } = useLocationTracking(isMapReady ? map : null);

  // Effect to handle initial map setup
  useEffect(() => {
    if (isMapReady && map) {
      setIsMapVisible(true);
    }
  }, [isMapReady, map]);

  return (
    <div className="h-[calc(100vh-200px)] rounded-lg overflow-hidden relative bg-gray-50">
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ 
          opacity: isMapVisible ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      {isMapReady && map && (
        <>
          <MapMarkersLayer 
            map={map}
            posts={posts}
            onPostClick={onPostClick}
          />
          <Button
            onClick={toggleLocationTracking}
            className={`absolute bottom-4 right-4 bg-white hover:bg-gray-100 text-gray-800 cursor-pointer`}
            size="icon"
            variant="outline"
          >
            <Locate 
              className={`h-4 w-4 ${isTracking ? 'text-blue-500 fill-blue-500' : ''}`} 
              strokeWidth={1.5}
            />
          </Button>
        </>
      )}
      <Toaster />
    </div>
  );
});

MapContainer.displayName = "MapContainer";
