import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { Post } from "@/types/post";
import { useNavigate } from "react-router-dom";

interface MapMarkersProps {
  map: mapboxgl.Map;
  posts: Post[];
}

export const MapMarkers = ({ map, posts }: MapMarkersProps) => {
  const markers = useRef<mapboxgl.Marker[]>([]);
  const navigate = useNavigate();
  const postsRef = useRef(posts);

  useEffect(() => {
    // Wait for map to be initialized and loaded
    if (!map || !map.loaded()) return;

    // Check if posts have actually changed
    if (
      postsRef.current.length === posts.length &&
      JSON.stringify(postsRef.current) === JSON.stringify(posts)
    ) {
      return;
    }

    postsRef.current = posts;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers
    posts.forEach((post) => {
      if (!post.coordinates) return;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="max-w-xs">
          <img src="${post.images[0]}" alt="${post.title}" class="w-full h-32 object-cover rounded-lg mb-2"/>
          <h3 class="font-semibold">${post.title}</h3>
          <p class="text-sm text-gray-600">${post.category}</p>
        </div>
      `);

      const el = document.createElement("div");
      el.className = "w-4 h-4 bg-primary rounded-full cursor-pointer";

      try {
        const marker = new mapboxgl.Marker(el)
          .setLngLat([post.coordinates.lng, post.coordinates.lat])
          .setPopup(popup)
          .addTo(map);

        el.addEventListener("click", () => {
          popup.addTo(map);
          navigate(`/?post=${post.id}`);
        });

        markers.current.push(marker);
      } catch (error) {
        console.error("Error adding marker:", error);
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
      map.fitBounds(bounds, { padding: 50 });
    }
  }, [map, posts, navigate]);

  return null;
};