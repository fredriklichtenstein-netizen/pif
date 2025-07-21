
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { Post } from "@/types/post";
import { createMapPopup } from "./MapPopup";
import { createMarkerElement } from "./MapMarkerElement";

interface MapMarkersLayerProps {
  map: mapboxgl.Map;
  posts: Post[];
  onPostClick: (postId: string) => void;
  targetItemId?: string | null;
}

export const MapMarkersLayer = ({ map, posts, onPostClick, targetItemId }: MapMarkersLayerProps) => {
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    const createMarkers = () => {
      console.log("Creating markers for posts:", posts.length);
      
      // Clear existing markers
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      
      // Process all posts
      for (const post of posts) {
        console.log("Processing post:", post.id, "coordinates:", post.coordinates);
        
        if (!post.coordinates) {
          console.log("Skipping post without coordinates:", post.id);
          continue;
        }

        const { lng, lat } = post.coordinates;
        
        if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
          console.log("Invalid coordinates for post:", post.id, { lng, lat });
          continue;
        }

        console.log("Creating marker for post:", post.id, "at", { lng, lat });

        try {
          const markerElement = createMarkerElement({
            onClick: () => onPostClick(post.id),
            onMouseEnter: () => {
              const popup = createMapPopup({ 
                post,
                displayCoordinates: { lng, lat }
              });
              popup.addTo(map);
            },
            onMouseLeave: () => {
              const popups = document.getElementsByClassName('mapboxgl-popup');
              while (popups[0]) popups[0].remove();
            }
          });

          const marker = new mapboxgl.Marker({
            element: markerElement,
            anchor: 'center'
          })
            .setLngLat([lng, lat])
            .addTo(map);

          console.log("Successfully added marker for post:", post.id);
          markers.current.push(marker);
        } catch (error) {
          console.error("Error creating marker for post:", post.id, error);
        }
      }

      // Fit map to show all markers if there are any
      if (markers.current.length > 0 && !targetItemId) {
        try {
          const bounds = new mapboxgl.LngLatBounds();
          markers.current.forEach(marker => {
            bounds.extend(marker.getLngLat());
          });
          
          map.fitBounds(bounds, { 
            padding: 50,
            maxZoom: 14,
            duration: 1000
          });
          console.log("Successfully fitted map to bounds with", markers.current.length, "markers");
        } catch (error) {
          console.error("Error fitting bounds:", error);
        }
      }
    };

    createMarkers();
  }, [posts, map, onPostClick, targetItemId]);

  return null;
};
