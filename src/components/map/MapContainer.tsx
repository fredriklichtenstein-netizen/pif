import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Post } from "@/types/post";
import { createMapPopup } from "./MapPopup";

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

      const el = document.createElement("div");
      el.className = "relative group";
      
      const dot = document.createElement("div");
      dot.className = "w-6 h-6 bg-primary rounded-full cursor-pointer transition-all duration-200 group-hover:scale-110 shadow-lg border-2 border-white";
      
      const pulse = document.createElement("div");
      pulse.className = "absolute -inset-1 bg-primary/30 rounded-full animate-pulse";
      
      el.appendChild(pulse);
      el.appendChild(dot);

      // Add event listeners
      el.addEventListener("click", () => onPostClick(post.id));
      el.addEventListener("mouseenter", () => {
        createMapPopup({ post }).addTo(map.current!);
      });
      el.addEventListener("mouseleave", () => {
        const popups = document.getElementsByClassName('mapboxgl-popup');
        while (popups[0]) popups[0].remove();
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([post.coordinates.lng, post.coordinates.lat])
        .addTo(map.current);

      markers.current.push(marker);
    });

    // Fit map to show all markers
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