import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { Post } from "@/types/post";
import { createMapPopup } from "./MapPopup";
import { createMarkerElement } from "./MapMarkerElement";

export const useMapMarkers = (map: mapboxgl.Map, posts: Post[], onMarkerClick: (postId: string) => void) => {
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map || !posts) {
      console.log("Map or posts not available");
      return;
    }

    console.log("Clearing existing markers");
    // Always clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    console.log(`Adding ${posts.length} markers to map`);
    // Add new markers
    posts.forEach((post) => {
      if (!post.coordinates) {
        console.warn(`Post ${post.id} has no coordinates`);
        return;
      }

      const popup = createMapPopup({ post });
      const markerElement = createMarkerElement({
        onClick: () => {
          console.log(`Marker clicked for post ${post.id}`);
          onMarkerClick(post.id);
        },
        onMouseEnter: () => popup.addTo(map),
        onMouseLeave: () => popup.remove(),
      });

      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: 'bottom',
      })
        .setLngLat([post.coordinates.lng, post.coordinates.lat])
        .addTo(map);

      markers.current.push(marker);
      console.log(`Added marker for post ${post.id}`);
    });

    // Fit bounds if there are markers
    if (markers.current.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      posts.forEach(post => {
        if (post.coordinates) {
          bounds.extend([post.coordinates.lng, post.coordinates.lat]);
        }
      });
      
      map.fitBounds(bounds, { 
        padding: 50,
        maxZoom: 14
      });
      console.log("Adjusted map bounds to show all markers");
    }
  }, [map, posts, onMarkerClick]); // Always run when these dependencies change

  return markers.current;
};