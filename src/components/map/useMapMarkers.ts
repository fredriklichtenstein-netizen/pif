import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { Post } from "@/types/post";
import { createMapPopup } from "./MapPopup";
import { createMarkerElement } from "./MapMarkerElement";

export const useMapMarkers = (map: mapboxgl.Map, posts: Post[], onMarkerClick: (postId: string) => void) => {
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map || !posts) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers for posts with coordinates
    posts.forEach((post) => {
      if (!post.coordinates) return;

      // Create marker
      const marker = new mapboxgl.Marker({
        element: createMarkerElement({
          onClick: () => onMarkerClick(post.id),
          onMouseEnter: () => createMapPopup({ post }).addTo(map),
          onMouseLeave: () => map.getPopup()?.remove(),
        })
      })
        .setLngLat([post.coordinates.lng, post.coordinates.lat])
        .addTo(map);

      markers.current.push(marker);
    });

    // Fit map to show all markers
    if (markers.current.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      posts.forEach(post => {
        if (post.coordinates) {
          bounds.extend([post.coordinates.lng, post.coordinates.lat]);
        }
      });
      
      map.fitBounds(bounds, { 
        padding: 50,
        maxZoom: 14,
        duration: 1000
      });
    }
  }, [map, posts, onMarkerClick]);

  return markers.current;
};