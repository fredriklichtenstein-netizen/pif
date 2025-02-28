
import mapboxgl from "mapbox-gl";
import type { Post } from "@/types/post";

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
    maxWidth: '200px', // Limit the width for better display
  });

  // Set simplified HTML content with just image and title
  popup.setHTML(`
    <div class="p-2">
      <img 
        src="${post.images[0] || 'https://api.dicebear.com/7.x/shapes/svg?seed=placeholder'}" 
        alt="${post.title}" 
        class="w-full h-24 object-cover rounded-lg mb-2"
        onerror="this.onerror=null; this.src='https://api.dicebear.com/7.x/shapes/svg?seed=placeholder';"
      />
      <h3 class="font-semibold text-sm truncate">${post.title}</h3>
    </div>
  `);

  // Use privacy-adjusted coordinates for map display
  popup.setLngLat([displayCoordinates.lng, displayCoordinates.lat]);

  return popup;
};
