
import type { Post } from "@/types/post";
import { useMapInitialization } from "./useMapInitialization";
import { MapMarkersLayer } from "./MapMarkersLayer";
import { Button } from "@/components/ui/button";
import { Locate, AlertCircle } from "lucide-react";
import { useEffect, useState, memo } from "react";
import { useLocationTracking } from "./useLocationTracking";

interface MapContainerProps {
  mapboxToken: string;
  posts: Post[];
  onPostClick: (postId: string) => void;
}

export const MapContainer = memo(({ mapboxToken, posts, onPostClick }: MapContainerProps) => {
  const { mapContainer, map, isMapReady, error } = useMapInitialization(mapboxToken);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const locationTracking = useLocationTracking(isMapReady ? map : null);

  useEffect(() => {
    if (isMapReady && map) {
      console.log("Map is ready, making it visible");
      // Short delay to ensure styles are loaded
      const timer = setTimeout(() => {
        setIsMapVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isMapReady, map]);

  return (
    <div className="h-full rounded-lg overflow-hidden relative bg-gray-50">
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
            <p className="text-gray-700 mb-2">Error initializing map</p>
            <p className="text-gray-500 text-sm">{error.message}</p>
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
