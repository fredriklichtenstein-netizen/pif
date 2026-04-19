import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import type Supercluster from "supercluster";
import type { Post } from "@/types/post";
import type { EnhancedPost } from "./markers/types";
import { useMarkerFactory } from "./markers/useMarkerFactory";
import { useClusterInit } from "./markers/useClusterInit";
import { useViewportMarkers } from "./markers/useViewportMarkers";

interface MapMarkersLayerProps {
  map: mapboxgl.Map;
  posts: Post[];
  onPostClick: (postId: string) => void;
  targetItemId?: string | null;
}

export const MapMarkersLayer = ({
  map,
  posts,
  onPostClick,
  targetItemId,
}: MapMarkersLayerProps) => {
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const clusterIndexRef = useRef<Supercluster<
    { postIndex: number },
    { postIndex: number }
  > | null>(null);
  const enhancedPostsRef = useRef<EnhancedPost[]>([]);
  const [mapReady, setMapReady] = useState(false);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => {
      try {
        marker.remove();
      } catch (error) {
        console.error("Error removing marker:", error);
      }
    });
    markersRef.current = [];
  }, []);

  const { createPostMarker, createClusterMarker } = useMarkerFactory({
    map,
    onPostClick,
    clusterIndexRef,
  });

  useClusterInit({
    map,
    posts,
    targetItemId,
    enhancedPostsRef,
    clusterIndexRef,
    clearMarkers,
    setMapReady,
  });

  useViewportMarkers({
    map,
    mapReady,
    markersRef,
    enhancedPostsRef,
    clusterIndexRef,
    clearMarkers,
    createPostMarker,
    createClusterMarker,
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => clearMarkers();
  }, [clearMarkers]);

  return null;
};
