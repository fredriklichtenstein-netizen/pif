
import { memo } from "react";
import type { Post } from "@/types/post";
import { useMarkerProcessor } from "./useMarkerProcessor";

interface MapMarkersLayerProps {
  map: mapboxgl.Map;
  posts: Post[];
  onPostClick: (postId: string) => void;
}

export const MapMarkersLayer = memo(({ map, posts, onPostClick }: MapMarkersLayerProps) => {
  // Use our new marker processor hook
  const { markersCount, processedCount, totalPosts } = useMarkerProcessor({
    map,
    posts,
    onPostClick
  });

  // This component doesn't render anything directly
  // All marker rendering is handled by the useMarkerProcessor hook
  return null;
});

MapMarkersLayer.displayName = "MapMarkersLayer";
