
import type { Post } from "@/types/post";
import { useMapInitialization } from "./useMapInitialization";
import { MapMarkersLayer } from "./MapMarkersLayer";
import { Button } from "@/components/ui/button";
import { Locate } from "lucide-react";
import { isUrbanArea } from "@/utils/locationPrivacy";

interface MapContainerProps {
  mapboxToken: string;
  posts: Post[];
  onPostClick: (postId: string) => void;
}

export const MapContainer = ({ mapboxToken, posts, onPostClick }: MapContainerProps) => {
  const { mapContainer, map, isMapReady } = useMapInitialization(mapboxToken);

  const handleGeolocation = () => {
    if (!map || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        
        // Set zoom based on urban/rural area
        const zoom = isUrbanArea(lat, lng) ? 13.5 : 8.5; // ~2km radius in urban, ~50km in rural
        
        map.flyTo({
          center: [lng, lat],
          zoom: zoom,
          duration: 2000,
          essential: true
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
      }
    );
  };

  return (
    <div className="h-[calc(100vh-200px)] rounded-lg overflow-hidden relative">
      <div ref={mapContainer} className="w-full h-full" />
      {isMapReady && map && (
        <>
          <MapMarkersLayer 
            map={map}
            posts={posts}
            onPostClick={onPostClick}
          />
          <Button
            onClick={handleGeolocation}
            className="absolute bottom-4 right-4 bg-white hover:bg-gray-100 text-gray-800"
            size="icon"
            variant="outline"
          >
            <Locate className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
};
