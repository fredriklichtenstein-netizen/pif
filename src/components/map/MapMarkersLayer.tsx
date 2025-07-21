
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
  targetItemId?: string | null;
}

export const MapMarkersLayer = ({ map, posts, onPostClick, targetItemId }: MapMarkersLayerProps) => {
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    const createMarkersWithPrivacy = async () => {
      console.log("Creating privacy-enhanced markers for posts:", posts.length);
      
      // Clear existing markers
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      
      // Process all posts with privacy enhancement
      const validPosts = posts.filter(post => {
        if (!post.coordinates) {
          console.log("Skipping post without coordinates:", post.id);
          return false;
        }

        const { lng, lat } = post.coordinates;
        if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
          console.log("Invalid coordinates for post:", post.id, { lng, lat });
          return false;
        }
        
        return true;
      });

      // Apply privacy distortion to all valid posts concurrently
      const privacyPromises = validPosts.map(async (post) => {
        const { lng, lat } = post.coordinates;
        console.log("Applying privacy distortion to post:", post.id, "original coordinates:", { lng, lat });
        
        try {
          const [privacyLng, privacyLat] = await addLocationPrivacy(lng, lat, map);
          console.log("Privacy-enhanced coordinates for post:", post.id, "adjusted:", { lng: privacyLng, lat: privacyLat });
          
          return {
            post,
            originalCoordinates: { lng, lat },
            privacyCoordinates: { lng: privacyLng, lat: privacyLat }
          };
        } catch (error) {
          console.error("Privacy distortion failed for post:", post.id, error);
          // Fallback to original coordinates with minimal offset
          const minimalOffsetLng = lng + (Math.random() - 0.5) * 0.001;
          const minimalOffsetLat = lat + (Math.random() - 0.5) * 0.001;
          return {
            post,
            originalCoordinates: { lng, lat },
            privacyCoordinates: { lng: minimalOffsetLng, lat: minimalOffsetLat }
          };
        }
      });

      try {
        const enhancedPosts = await Promise.all(privacyPromises);
        
        // Create markers using privacy-enhanced coordinates
        for (const { post, privacyCoordinates } of enhancedPosts) {
          const { lng: privacyLng, lat: privacyLat } = privacyCoordinates;
          
          console.log("Creating privacy-enhanced marker for post:", post.id, "at privacy coordinates:", { lng: privacyLng, lat: privacyLat });

          try {
            const markerElement = createMarkerElement({
              onClick: () => onPostClick(post.id),
              onMouseEnter: () => {
                const popup = createMapPopup({ 
                  post,
                  displayCoordinates: privacyCoordinates
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
              .setLngLat([privacyLng, privacyLat])
              .addTo(map);

            console.log("Successfully added privacy-enhanced marker for post:", post.id);
            markers.current.push(marker);
          } catch (error) {
            console.error("Error creating privacy-enhanced marker for post:", post.id, error);
          }
        }

        // Force map repaint after adding all markers
        if (markers.current.length > 0) {
          console.log(`Added ${markers.current.length} markers, forcing map repaint`);
          map.triggerRepaint();
        }

        // Improved map bounds fitting with better padding and zoom levels
        if (markers.current.length > 0 && !targetItemId) {
          try {
            const bounds = new mapboxgl.LngLatBounds();
            markers.current.forEach(marker => {
              bounds.extend(marker.getLngLat());
            });
            
            // Calculate optimal padding and zoom based on number of markers
            const markerCount = markers.current.length;
            let padding = 50;
            let maxZoom = 14;
            
            if (markerCount === 1) {
              // Single marker - use moderate zoom
              padding = 100;
              maxZoom = 13;
            } else if (markerCount <= 5) {
              // Few markers - allow closer zoom
              padding = 80;
              maxZoom = 14;
            } else if (markerCount <= 20) {
              // Many markers - more padding
              padding = 100;
              maxZoom = 12;
            } else {
              // Very many markers - wide view
              padding = 150;
              maxZoom = 11;
            }
            
            map.fitBounds(bounds, { 
              padding: {
                top: padding,
                bottom: padding + 60, // Extra bottom padding for navigation
                left: padding,
                right: padding
              },
              maxZoom,
              duration: 1500
            });
            console.log(`Successfully fitted map to bounds with ${markers.current.length} privacy-enhanced markers`);
          } catch (error) {
            console.error("Error fitting bounds:", error);
          }
        } else if (targetItemId && markers.current.length > 0) {
          // If targeting a specific item, focus on that marker with privacy consideration
          try {
            const targetMarker = markers.current[0]; // Assuming the target is the first/only marker
            if (targetMarker) {
              map.flyTo({
                center: targetMarker.getLngLat(),
                zoom: 15,
                duration: 2000
              });
              console.log('Focused on target item with privacy-enhanced coordinates');
            }
          } catch (error) {
            console.error("Error focusing on target item:", error);
          }
        }
      } catch (error) {
        console.error("Error processing privacy enhancements:", error);
      }
    };

    createMarkersWithPrivacy();
  }, [posts, map, onPostClick, targetItemId]);

  return null;
};
