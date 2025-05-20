
import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { Post } from '@/types/post';
import { createMapPopup } from './MapPopup';
import { createMarkerElement } from './MapMarkerElement';
import { queueCoordinateProcessing } from '@/utils/location/batchPrivacyProcessor';
import { parseCoordinatesFromDB } from '@/types/post';
import { useMapLoadingState, MapLoadingPhase } from '@/hooks/map/useMapLoadingState';

interface MarkerProcessorOptions {
  posts: Post[];
  map: mapboxgl.Map | null;
  onPostClick: (postId: string) => void;
}

export const useMarkerProcessor = ({ posts, map, onPostClick }: MarkerProcessorOptions) => {
  const [processedCount, setProcessedCount] = useState(0);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const processedCoordinates = useRef<Map<string, [number, number]>>(new Map());
  const { setPhase, setProgress } = useMapLoadingState();
  
  // Clean up markers when component unmounts or when posts change
  useEffect(() => {
    return () => {
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
    };
  }, []);
  
  // Process posts and create markers
  useEffect(() => {
    if (!map || !map.loaded() || !posts.length) return;

    // Remove existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
    setProcessedCount(0);

    // Start the markers processing phase
    setPhase(MapLoadingPhase.MARKERS_PROCESSING);
    
    // Create array to hold all marker processing promises
    const markerPromises: Promise<void>[] = [];
    let validPosts = 0;
    
    // Count valid posts with coordinates
    posts.forEach(post => {
      if (post.coordinates) {
        try {
          const coords = parseCoordinatesFromDB(post.coordinates);
          if (coords) validPosts++;
        } catch (e) {/* invalid coords */}
      }
    });
    
    if (validPosts === 0) {
      setPhase(MapLoadingPhase.COMPLETE);
      return;
    }
    
    let completedPosts = 0;
    
    // Process each post
    posts.forEach(post => {
      if (!post.coordinates) return;
      
      try {
        const coords = parseCoordinatesFromDB(post.coordinates);
        if (!coords) return;
        
        // Create a promise for this marker's processing
        const markerPromise = new Promise<void>(resolve => {
          // Queue this coordinate for privacy processing
          queueCoordinateProcessing(
            post.id,
            coords.lng, 
            coords.lat,
            (privateCoords: [number, number]) => {
              try {
                // Store the processed coordinates
                processedCoordinates.current.set(post.id, privateCoords);
                
                // Only create the marker if the map still exists
                if (map && !map.isRemoved()) {
                  const markerElement = createMarkerElement({
                    onClick: () => onPostClick(post.id),
                    onMouseEnter: () => {
                      const popup = createMapPopup({ 
                        post,
                        displayCoordinates: { 
                          lng: privateCoords[0], 
                          lat: privateCoords[1] 
                        }
                      });
                      popup.addTo(map);
                    },
                    onMouseLeave: () => {
                      const popups = document.getElementsByClassName('mapboxgl-popup');
                      while (popups[0]) popups[0].remove();
                    }
                  });
    
                  // Create and add the marker
                  const marker = new mapboxgl.Marker({
                    element: markerElement,
                    anchor: 'center'
                  })
                    .setLngLat(privateCoords)
                    .addTo(map);
                  
                  markers.current.push(marker);
                }

                // Update progress
                completedPosts++;
                setProcessedCount(prevCount => prevCount + 1);
                setProgress(Math.round((completedPosts / validPosts) * 100));

                // Mark this marker as processed
                resolve();
              } catch (error) {
                console.error(`Error creating marker for post ${post.id}:`, error);
                resolve(); // Resolve anyway to continue processing
              }
            }
          );
        });
        
        markerPromises.push(markerPromise);
      } catch (error) {
        console.error(`Error processing coordinates for post ${post.id}:`, error);
      }
    });
    
    // When all markers are processed, fit the map to show them
    Promise.all(markerPromises).then(() => {
      if (!map || map.isRemoved() || markers.current.length === 0) {
        setPhase(MapLoadingPhase.COMPLETE);
        return;
      }
      
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
        
        console.log(`Fitted map to bounds with ${markers.current.length} markers`);
      } catch (error) {
        console.error("Error fitting bounds:", error);
      } finally {
        // Mark markers processing as complete
        setPhase(MapLoadingPhase.COMPLETE);
      }
    });
    
  }, [map, posts, onPostClick, setPhase, setProgress]);
  
  return { 
    markersCount: markers.current.length,
    processedCount,
    totalPosts: posts.length
  };
};
