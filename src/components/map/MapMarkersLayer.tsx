import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { Post } from "@/types/post";
import { createMapPopup } from "./MapPopup";
import { createMarkerElement } from "./MapMarkerElement";
import { addLocationPrivacy } from "@/utils/locationPrivacy";

interface MapMarkersLayerProps {
  map: mapboxgl.Map;
  posts: Post[];
  onPostClick: (postId: string) => void;
}

export const MapMarkersLayer = ({ map, posts, onPostClick }: MapMarkersLayerProps) => {
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    console.log("Updating markers for posts:", posts);

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers with privacy offsets
    posts.forEach(post => {
      if (!post.coordinates) {
        console.log("Skipping post without coordinates:", post.id);
        return;
      }

      // Add privacy offset to coordinates
      const [privateLng, privateLat] = addLocationPrivacy(
        post.coordinates.lng,
        post.coordinates.lat
      );

      console.log("Creating privacy-adjusted marker for post:", post.id, "at:", [privateLng, privateLat]);

      const markerElement = createMarkerElement({
        onClick: () => onPostClick(post.id),
        onMouseEnter: () => {
          const popup = createMapPopup({ 
            post: {
              ...post,
              coordinates: { lng: privateLng, lat: privateLat }
            }
          });
          popup.addTo(map);
        },
        onMouseLeave: () => {
          const popups = document.getElementsByClassName('mapboxgl-popup');
          while (popups[0]) popups[0].remove();
        }
      });

      const marker = new mapboxgl.Marker({ element: markerElement })
        .setLngLat([privateLng, privateLat] as [number, number])
        .addTo(map);

      markers.current.push(marker);
    });

    // Fit map to show all markers if there are any
    if (markers.current.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      markers.current.forEach(marker => {
        bounds.extend(marker.getLngLat());
      });
      
      map.fitBounds(bounds, { 
        padding: 50,
        maxZoom: 14,
        duration: 1000
      });
    }
  }, [posts, map, onPostClick]);

  return null;
};