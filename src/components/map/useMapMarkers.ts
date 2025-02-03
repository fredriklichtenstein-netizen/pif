import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { Post } from "@/types/post";
import { createMapPopup } from "./MapPopup";
import { createMarkerElement } from "./MapMarkerElement";

export const useMapMarkers = (map: mapboxgl.Map, posts: Post[], onMarkerClick: (postId: string) => void) => {
  const markers = useRef<mapboxgl.Marker[]>([]);
  const postsRef = useRef(posts);

  useEffect(() => {
    if (!map || !map.loaded()) {
      console.log("Map not ready yet");
      return;
    }

    if (
      postsRef.current.length === posts.length &&
      JSON.stringify(postsRef.current) === JSON.stringify(posts)
    ) {
      console.log("Posts unchanged, skipping marker update");
      return;
    }

    console.log("Updating markers with posts:", posts);
    postsRef.current = posts;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers
    posts.forEach((post) => {
      if (!post.coordinates) {
        console.warn(`Post ${post.id} has no coordinates`);
        return;
      }

      console.log(`Adding marker for post ${post.id} at:`, post.coordinates);

      try {
        const popup = createMapPopup({ post });

        const markerElement = createMarkerElement({
          onClick: () => onMarkerClick(post.id),
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
        console.log(`Successfully added marker for post ${post.id}`);
      } catch (error) {
        console.error("Error adding marker:", error, post);
      }
    });

    // Fit bounds to show all markers if there are any and if it's the first load
    if (markers.current.length > 0 && !map.isMoving()) {
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
      console.log("Fitted bounds to show all markers");
    }
  }, [map, posts, onMarkerClick]);

  return markers.current;
};