
import type { Post } from "@/types/post";
import { useMapInitialization } from "./useMapInitialization";
import { MapMarkersLayer } from "./MapMarkersLayer";
import { Button } from "@/components/ui/button";
import { Locate } from "lucide-react";
import { useEffect, useState, memo } from "react";
import { useLocationTracking } from "./useLocationTracking";

interface MapContainerProps {
  mapboxToken: string;
  posts: Post[];
  onPostClick: (postId: string) => void;
}

export const MapContainer = memo(({ mapboxToken, posts, onPostClick }: MapContainerProps) => {
  const { mapContainer, map, isMapReady } = useMapInitialization(mapboxToken);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);
  const locationTracking = useLocationTracking(isMapReady ? map : null);

  useEffect(() => {
    if (isMapReady && map) {
      console.log("Map is ready, checking style loaded state");
      
      // Check if style is already loaded
      if (map.isStyleLoaded()) {
        console.log("Map style is already loaded");
        setIsStyleLoaded(true);
      } else {
        console.log("Waiting for map style to load");
        
        // Set up style loaded event listener
        const checkStyleLoaded = () => {
          if (map.isStyleLoaded()) {
            console.log("Map style loaded via check");
            setIsStyleLoaded(true);
            return true;
          }
          return false;
        };
        
        // Try immediately
        if (!checkStyleLoaded()) {
          // If not loaded, set up event listener
          map.once('style.load', () => {
            console.log("Map style loaded via event");
            setIsStyleLoaded(true);
          });
          
          // Also set a timeout as a fallback
          setTimeout(() => {
            if (!isStyleLoaded) {
              console.log("Style load timeout - forcing loaded state");
              setIsStyleLoaded(true);
            }
          }, 3000);
        }
      }
      
      setIsMapVisible(true);
    }
  }, [isMapReady, map, isStyleLoaded]);

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
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing map...</p>
          </div>
        </div>
      )}
      {isMapReady && (
        <>
          {isStyleLoaded && posts && posts.length > 0 && (
            <MapMarkersLayer 
              map={map}
              posts={posts}
              onPostClick={onPostClick}
            />
          )}
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
