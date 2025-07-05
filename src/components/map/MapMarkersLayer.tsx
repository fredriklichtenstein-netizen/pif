
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { Post } from "@/types/post";
import { createMapPopup } from "./MapPopup";
import { createMarkerElement } from "./MapMarkerElement";
import { addLocationPrivacy } from "@/utils/locationPrivacy";
import { parseCoordinatesFromDB } from "@/types/post";

interface MapMarkersLayerProps {
  map: mapboxgl.Map;
  posts: Post[];
  onPostClick: (postId: string) => void;
  targetLocation?: string | null;
}

export const MapMarkersLayer = ({ map, posts, onPostClick, targetLocation }: MapMarkersLayerProps) => {
  const markers = useRef<mapboxgl.Marker[]>([]);
  const processedCoordinates = useRef<Map<string, [number, number]>>(new Map());

  useEffect(() => {
    const createMarkers = async () => {
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

        try {
          const coords = post.coordinates; // coordinates are already parsed objects
          console.log("Coords object:", coords, "lng:", coords?.lng, "lat:", coords?.lat);
          
          if (!coords || typeof coords.lng !== 'number' || typeof coords.lat !== 'number' || isNaN(coords.lng) || isNaN(coords.lat)) {
            console.log("Invalid coordinates format for post:", post.id, coords);
            continue;
          }

          // Use cached privacy-adjusted coordinates if they exist
          let privateLng: number, privateLat: number;
          const cachedCoords = processedCoordinates.current.get(post.id);
          
          if (cachedCoords) {
            [privateLng, privateLat] = cachedCoords;
            console.log("Using cached coordinates for post:", post.id);
          } else {
            // Calculate new privacy-adjusted coordinates - fix: removing the third argument (map)
            [privateLng, privateLat] = await addLocationPrivacy(
              coords.lng,
              coords.lat
            );
            console.log("Generated new private coordinates for post:", post.id, [privateLng, privateLat]);
            processedCoordinates.current.set(post.id, [privateLng, privateLat]);
          }

          const markerElement = createMarkerElement({
            onClick: () => onPostClick(post.id),
            onMouseEnter: () => {
              const popup = createMapPopup({ 
                post,
                displayCoordinates: { lng: privateLng, lat: privateLat }
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

          console.log("Successfully added marker for post:", post.id);
          markers.current.push(marker);
        } catch (error) {
          console.error("Error creating marker for post:", post.id, error);
        }
      }

      // Fit map to show all markers if there are any (only if no target location specified)
      if (markers.current.length > 0 && !targetLocation) {
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
  }, [posts, map, onPostClick]);

  return null;
};
