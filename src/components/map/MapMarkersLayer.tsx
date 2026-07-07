import { useCallback, useEffect, useRef, useState } from "react";
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
  currentUserId?: string | null;
}

export const MapMarkersLayer = ({
  map,
  posts,
  onPostClick,
  targetItemId,
  currentUserId,
}: MapMarkersLayerProps) => {
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const clusterIndexRef = useRef<Supercluster<
    { postIndex: number },
    { postIndex: number }
  > | null>(null);
  const enhancedPostsRef = useRef<EnhancedPost[]>([]);
  const [mapReady, setMapReady] = useState(false);
  // Incremented every time `useClusterInit` finishes rebuilding the
  // cluster index for a new `posts` array. Threaded into
  // `useViewportMarkers` so it repaints markers exactly once the
  // async rebuild completes — fixes stale markers after filter changes.
  const [clusterVersion, setClusterVersion] = useState(0);
  const bumpClusterVersion = useCallback(
    () => setClusterVersion((v) => v + 1),
    []
  );

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
    bumpClusterVersion,
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
    clusterVersion,
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => clearMarkers();
  }, [clearMarkers]);

  return null;
};

