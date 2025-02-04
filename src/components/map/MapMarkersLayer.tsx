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
  const processedCoordinates = useRef<Map<string, [number, number]>>(new Map());

  useEffect(() => {
    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers with privacy offsets
    posts.forEach(post => {
      if (!post.coordinates) return;

      // Use cached privacy-adjusted coordinates if they exist
      let privateLng: number, privateLat: number;
      const cachedCoords = processedCoordinates.current.get(post.id);
      
      if (cachedCoords) {
        [privateLng, privateLat] = cachedCoords;
      } else {
        // Calculate new privacy-adjusted coordinates
        [privateLng, privateLat] = addLocationPrivacy(
          post.coordinates.lng,
          post.coordinates.lat
        );
        // Cache the coordinates
        processedCoordinates.current.set(post.id, [privateLng, privateLat]);
      }

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

      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: 'center'
      })
        .setLngLat([privateLng, privateLat])
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