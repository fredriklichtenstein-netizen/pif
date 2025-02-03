import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { Post } from "@/types/post";
import { createMapPopup } from "./MapPopup";
import { createMarkerElement } from "./MapMarkerElement";

export const useMapMarkers = (map: mapboxgl.Map, posts: Post[], onMarkerClick: (postId: string) => void) => {
  const markers = useRef<mapboxgl.Marker[]>([]);
  const postsRef = useRef(posts);

  useEffect(() => {
    if (!map) {
      console.log("Map instance not available");
      return;
    }

    if (!posts || posts.length === 0) {
      console.log("No posts available to display markers");
      return;
    }

    // Check if posts have changed
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
        console.warn(`Post ${post.id} has no coordinates, skipping marker`);
        return;
      }

      try {
        console.log(`Creating marker for post ${post.id} at:`, post.coordinates);
        
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
        console.log(`Successfully added marker for post ${post.id}`);
      } catch (error) {
        console.error(`Error adding marker for post ${post.id}:`, error);
      }
    });

    // Fit bounds to show all markers if there are any
    if (markers.current.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      posts.forEach(post => {
        if (post.coordinates) {
          bounds.extend([post.coordinates.lng, post.coordinates.lat]);
        }
      });
      
      try {
        map.fitBounds(bounds, { 
          padding: 50,
          maxZoom: 14
        });
        console.log("Map bounds adjusted to show all markers");
      } catch (error) {
        console.error("Error fitting bounds:", error);
      }
    }
  }, [map, posts, onMarkerClick]);

  return markers.current;
};