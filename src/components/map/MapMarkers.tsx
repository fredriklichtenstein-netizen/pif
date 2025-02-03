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
    if (!map || !map.loaded()) {
      console.log("Map not ready yet");
      return;
    }

    // Check if posts have actually changed
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
        console.warn(`Post ${post.id} has no coordinates`);
        return;
      }

      console.log(`Adding marker for post ${post.id} at:`, post.coordinates);

      // Create custom marker element
      const el = document.createElement("div");
      el.className = "relative group";

      // Marker dot
      const dot = document.createElement("div");
      dot.className = "w-4 h-4 bg-primary rounded-full cursor-pointer transition-transform group-hover:scale-110 shadow-lg";
      el.appendChild(dot);

      try {
        const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'bottom',
        })
          .setLngLat([post.coordinates.lng, post.coordinates.lat])
          .addTo(map);

        // Create popup with post details
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
          anchor: 'bottom',
        })
          .setHTML(`
            <div class="max-w-xs p-2">
              <img 
                src="${post.images[0]}" 
                alt="${post.title}" 
                class="w-full h-32 object-cover rounded-lg mb-2"
              />
              <h3 class="font-semibold text-sm">${post.title}</h3>
              <p class="text-xs text-gray-600 mt-1">${post.category}</p>
              <p class="text-xs text-gray-500 mt-1">${post.location}</p>
            </div>
          `);

        // Show popup on hover
        el.addEventListener("mouseenter", () => {
          popup.addTo(map);
        });

        el.addEventListener("mouseleave", () => {
          popup.remove();
        });

        // Navigate to post details on click
        el.addEventListener("click", () => {
          navigate(`/?post=${post.id}`);
        });

        markers.current.push(marker);
        console.log(`Successfully added marker for post ${post.id}`);
      } catch (error) {
        console.error("Error adding marker:", error, post);
      }
    });

    // Fit bounds to show all markers if there are any and if it's the first load
    if (markers.current.length > 0 && !map.isMoving()) {
      const bounds = new mapboxgl.LngLatBounds();
      posts.forEach(post => {
        if (post.coordinates) {
          bounds.extend([post.coordinates.lng, post.coordinates.lat]);
        }
      });
      map.fitBounds(bounds, { 
        padding: 50,
        maxZoom: 14 // Prevent zooming in too close
      });
      console.log("Fitted bounds to show all markers");
    }
  }, [map, posts, navigate]);

  return null;
};