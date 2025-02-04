import type { Post } from "@/types/post";
import { useMapInitialization } from "./useMapInitialization";
import { MapMarkersLayer } from "./MapMarkersLayer";

interface MapContainerProps {
  mapboxToken: string;
  posts: Post[];
  onPostClick: (postId: string) => void;
}

export const MapContainer = ({ mapboxToken, posts, onPostClick }: MapContainerProps) => {
  const { mapContainer, map, isMapReady } = useMapInitialization(mapboxToken);

  return (
    <div className="h-[calc(100vh-200px)] rounded-lg overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
      {isMapReady && map && (
        <MapMarkersLayer 
          map={map}
          posts={posts}
          onPostClick={onPostClick}
        />
      )}
    </div>
  );
};