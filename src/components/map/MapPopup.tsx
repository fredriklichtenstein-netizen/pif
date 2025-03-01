
import mapboxgl from "mapbox-gl";
import type { Post } from "@/types/post";
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
    offset: 15, // Reduced from 25
    closeButton: false,
    anchor: 'bottom',
    maxWidth: '160px', // Reduced from 200px
  });

  // Set ultra-compact popup content
  popup.setHTML(`
    <div class="p-0 max-w-[160px]">
      <img 
        src="${post.images[0]}" 
        alt="${post.title}" 
        class="w-full h-20 object-cover mb-0.5"
      />
      <h3 class="text-xs font-semibold truncate px-1">${post.title}</h3>
    </div>
  `);

  // Use privacy-adjusted coordinates for map display
  popup.setLngLat([displayCoordinates.lng, displayCoordinates.lat]);

  return popup;
};
