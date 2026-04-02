
import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import Supercluster from "supercluster";
import type { Post } from "@/types/post";
import { createMapPopup } from "./MapPopup";
import { createMarkerElement } from "./MapMarkerElement";
import { createClusterElement } from "./ClusterMarkerElement";
import { addLocationPrivacy } from "@/utils/locationPrivacy";

interface MapMarkersLayerProps {
  map: mapboxgl.Map;
  posts: Post[];
  onPostClick: (postId: string) => void;
  targetItemId?: string | null;
}

interface EnhancedPost {
  post: Post;
  originalCoordinates: { lng: number; lat: number };
  privacyCoordinates: { lng: number; lat: number };
}

type PointFeature = GeoJSON.Feature<GeoJSON.Point, { postIndex: number }>;

export const MapMarkersLayer = ({ map, posts, onPostClick, targetItemId }: MapMarkersLayerProps) => {
  const markers = useRef<mapboxgl.Marker[]>([]);
  const clusterIndex = useRef<Supercluster<{ postIndex: number }, { postIndex: number }> | null>(null);
  const enhancedPostsRef = useRef<EnhancedPost[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // Clear all markers
  const clearMarkers = useCallback(() => {
    markers.current.forEach(marker => {
      try {
        marker.remove();
      } catch (error) {
        console.error("Error removing marker:", error);
      }
    });
    markers.current = [];
  }, []);

  // Create individual post marker
  const createPostMarker = useCallback((enhancedPost: EnhancedPost) => {
    const { post, privacyCoordinates } = enhancedPost;
    const rawType = String(post.item_type || 'offer');
    const itemType: 'offer' | 'request' = 
      (rawType === 'request' || rawType === 'wish') ? 'request' : 'offer';
    
    const markerElement = createMarkerElement({
      onClick: () => onPostClick(post.id),
      onMouseEnter: () => {
        const popup = createMapPopup({ post, displayCoordinates: privacyCoordinates });
        popup.addTo(map);
      },
      onMouseLeave: () => {
        const popups = document.getElementsByClassName('mapboxgl-popup');
        while (popups[0]) popups[0].remove();
      },
      itemType
    });

    return new mapboxgl.Marker({ element: markerElement, anchor: 'center' })
      .setLngLat([privacyCoordinates.lng, privacyCoordinates.lat]);
  }, [map, onPostClick]);

  // Create cluster marker
  const createClusterMarker = useCallback((lng: number, lat: number, count: number, clusterId: number) => {
    const clusterElement = createClusterElement({
      count,
      onClick: () => {
        // Zoom into cluster on click
        if (clusterIndex.current) {
          const expansionZoom = clusterIndex.current.getClusterExpansionZoom(clusterId);
          map.flyTo({
            center: [lng, lat],
            zoom: Math.min(expansionZoom, 16),
            duration: 500
          });
        }
      }
    });

    return new mapboxgl.Marker({ element: clusterElement, anchor: 'center' })
      .setLngLat([lng, lat]);
  }, [map]);

  // Update markers based on current zoom and bounds
  const updateMarkers = useCallback(() => {
    if (!clusterIndex.current || !mapReady || enhancedPostsRef.current.length === 0) return;

    clearMarkers();

    const bounds = map.getBounds();
    const zoom = Math.floor(map.getZoom());

    // Get clusters for current viewport
    const clusters = clusterIndex.current.getClusters(
      [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      zoom
    );
    clusters.forEach(cluster => {
      const [lng, lat] = cluster.geometry.coordinates;
      const props = cluster.properties as any;
      
      if (props.cluster) {
        // It's a cluster
        const marker = createClusterMarker(
          lng, 
          lat, 
          props.point_count, 
          props.cluster_id
        );
        marker.addTo(map);
        markers.current.push(marker);
      } else {
        // It's an individual point
        const postIndex = props.postIndex;
        const enhancedPost = enhancedPostsRef.current[postIndex];
        if (enhancedPost) {
          const marker = createPostMarker(enhancedPost);
          marker.addTo(map);
          markers.current.push(marker);
        }
      }
    });
  }, [map, mapReady, clearMarkers, createPostMarker, createClusterMarker]);

  // Initialize cluster index when posts change
  useEffect(() => {
    const initializeClusters = async () => {
      // Filter valid posts
      const validPosts = posts.filter(post => {
        if (!post.coordinates) return false;
        const { lng, lat } = post.coordinates;
        return typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat);
      });

      if (validPosts.length === 0) {
        clearMarkers();
        return;
      }

      // Apply privacy distortion to all posts
      const enhancedPosts = await Promise.all(
        validPosts.map(async (post) => {
          const { lng, lat } = post.coordinates;
          try {
            const [privacyLng, privacyLat] = await addLocationPrivacy(lng, lat, map);
            return {
              post,
              originalCoordinates: { lng, lat },
              privacyCoordinates: { lng: privacyLng, lat: privacyLat }
            };
          } catch {
            const minimalOffsetLng = lng + (Math.random() - 0.5) * 0.001;
            const minimalOffsetLat = lat + (Math.random() - 0.5) * 0.001;
            return {
              post,
              originalCoordinates: { lng, lat },
              privacyCoordinates: { lng: minimalOffsetLng, lat: minimalOffsetLat }
            };
          }
        })
      );

      enhancedPostsRef.current = enhancedPosts;

      // Create GeoJSON features for supercluster
      const features: PointFeature[] = enhancedPosts.map((ep, index) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [ep.privacyCoordinates.lng, ep.privacyCoordinates.lat]
        },
        properties: { postIndex: index }
      }));

      // Initialize supercluster
      clusterIndex.current = new Supercluster({
        radius: 60,
        maxZoom: 16,
        minZoom: 0,
        minPoints: 2
      });
      clusterIndex.current.load(features);
      // Fit bounds on initial load
      if (!targetItemId && enhancedPosts.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        enhancedPosts.forEach(ep => bounds.extend([ep.privacyCoordinates.lng, ep.privacyCoordinates.lat]));
        
        map.fitBounds(bounds, {
          padding: { top: 80, bottom: 120, left: 80, right: 80 },
          maxZoom: 14,
          duration: 1500
        });
      } else if (targetItemId) {
        const targetPost = enhancedPosts.find(ep => ep.post.id === targetItemId);
        if (targetPost) {
          map.flyTo({
            center: [targetPost.privacyCoordinates.lng, targetPost.privacyCoordinates.lat],
            zoom: 15,
            duration: 2000
          });
        }
      }

      setMapReady(true);
    };

    initializeClusters();
  }, [posts, map, targetItemId, clearMarkers]);

  // Update markers on zoom/move
  useEffect(() => {
    if (!mapReady) return;

    const handleUpdate = () => updateMarkers();
    
    map.on('zoomend', handleUpdate);
    map.on('moveend', handleUpdate);
    
    // Initial render
    updateMarkers();

    return () => {
      map.off('zoomend', handleUpdate);
      map.off('moveend', handleUpdate);
    };
  }, [map, mapReady, updateMarkers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearMarkers();
  }, [clearMarkers]);

  return null;
};

