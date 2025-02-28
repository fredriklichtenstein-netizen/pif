
import mapboxgl from "mapbox-gl";
import type { Post } from "@/types/post";
import { calculateDistance, formatDistance } from "@/utils/distance";
import { parseCoordinatesFromDB } from "@/types/post";

interface MapPopupProps {
  post: Post;
  displayCoordinates: {
    lng: number;
    lat: number;
  };
}

export const createMapPopup = ({ post, displayCoordinates }: MapPopupProps): mapboxgl.Popup => {
  const popup = new mapboxgl.Popup({
    offset: 25,
    closeButton: false,
    anchor: 'bottom',
  });

  // Get user's current position and update distance using TRUE coordinates
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!post.coordinates) return;
        
        const originalCoords = parseCoordinatesFromDB(post.coordinates);
        if (!originalCoords) return;
        
        // Use original coordinates for distance calculation
        const distance = calculateDistance(
          position.coords.latitude,
          position.coords.longitude,
          originalCoords.lat,
          originalCoords.lng
        );
        
        popup.setHTML(`
          <div class="max-w-xs p-2">
            <img 
              src="${post.images[0]}" 
              alt="${post.title}" 
              class="w-full h-32 object-cover rounded-lg mb-2"
            />
            <h3 class="font-semibold text-sm">${post.title}</h3>
            <p class="text-xs text-gray-600 mt-1">${post.category}</p>
            <p class="text-xs text-gray-500 mt-1">${formatDistance(distance)}</p>
            <p class="text-xs text-gray-400 mt-1">Location shown is approximate for privacy</p>
          </div>
        `);
      },
      () => {
        // If geolocation fails, show default popup
        popup.setHTML(`
          <div class="max-w-xs p-2">
            <img 
              src="${post.images[0]}" 
              alt="${post.title}" 
              class="w-full h-32 object-cover rounded-lg mb-2"
            />
            <h3 class="font-semibold text-sm">${post.title}</h3>
            <p class="text-xs text-gray-600 mt-1">${post.category}</p>
            <p class="text-xs text-gray-500 mt-1">Enable location to see distance</p>
            <p class="text-xs text-gray-400 mt-1">Location shown is approximate for privacy</p>
          </div>
        `);
      }
    );
  }

  // Use privacy-adjusted coordinates for map display
  popup.setLngLat([displayCoordinates.lng, displayCoordinates.lat]);

  return popup;
};
