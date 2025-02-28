
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
    offset: 25,
    closeButton: false,
    anchor: 'bottom',
    maxWidth: '200px', // Limit popup width
  });

  // Set simplified popup content immediately
  popup.setHTML(`
    <div class="p-1 max-w-[180px]">
      <img 
        src="${post.images[0]}" 
        alt="${post.title}" 
        class="w-full h-24 object-cover rounded mb-1"
      />
      <h3 class="font-semibold text-sm truncate">${post.title}</h3>
    </div>
  `);

  // Use privacy-adjusted coordinates for map display
  popup.setLngLat([displayCoordinates.lng, displayCoordinates.lat]);

  return popup;
};
