import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Post } from "@/types/post";
import { createMapPopup } from "./MapPopup";
import { createMarkerElement } from "./MapMarkerElement";

interface MapContainerProps {
  mapboxToken: string;
  posts: Post[];
  onPostClick: (postId: string) => void;
}

export const MapContainer = ({ mapboxToken, posts, onPostClick }: MapContainerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;
    
    mapboxgl.accessToken = mapboxToken;
    
    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [18.0686, 59.3293], // Stockholm center
      zoom: 11,
    });

    newMap.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Wait for both map and style to load
    const checkIfReady = () => {
      if (newMap.loaded() && newMap.isStyleLoaded()) {
        console.log("Map is fully ready");
        map.current = newMap;
        setIsMapReady(true);
      }
    };

    newMap.on('load', checkIfReady);
    newMap.on('style.load', checkIfReady);

    return () => {
      newMap.remove();
      map.current = null;
      setIsMapReady(false);
    };
  }, [mapboxToken]);

  // Handle posts updates
  useEffect(() => {
    if (!isMapReady || !map.current) return;

    console.log("Updating markers for posts:", posts);

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers
    posts.forEach(post => {
      if (!post.coordinates) {
        console.log("Skipping post without coordinates:", post.id);
        return;
      }

      // Create coordinates array in the correct format [longitude, latitude]
      const coordinates = [post.coordinates.lng, post.coordinates.lat];
      console.log("Creating marker at coordinates:", coordinates, "for post:", post.id);

      const markerElement = createMarkerElement({
        onClick: () => onPostClick(post.id),
        onMouseEnter: () => {
          const popup = createMapPopup({ post });
          popup.addTo(map.current!);
        },
        onMouseLeave: () => {
          const popups = document.getElementsByClassName('mapboxgl-popup');
          while (popups[0]) popups[0].remove();
        }
      });

      const marker = new mapboxgl.Marker({ element: markerElement })
        .setLngLat(coordinates)
        .addTo(map.current);

      markers.current.push(marker);
    });

    // Fit map to show all markers if there are any
    if (markers.current.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      posts.forEach(post => {
        if (post.coordinates) {
          bounds.extend([post.coordinates.lng, post.coordinates.lat]);
        }
      });
      
      map.current.fitBounds(bounds, { 
        padding: 50,
        maxZoom: 14,
        duration: 1000
      });
    }
  }, [posts, isMapReady, onPostClick]);

  return (
    <div className="h-[calc(100vh-200px)] rounded-lg overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};