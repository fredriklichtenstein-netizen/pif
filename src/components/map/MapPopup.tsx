import mapboxgl from "mapbox-gl";
import type { Post } from "@/types/post";

interface MapPopupProps {
  post: Post;
}

export const createMapPopup = ({ post }: MapPopupProps): mapboxgl.Popup => {
  return new mapboxgl.Popup({
    offset: 25,
    closeButton: false,
    anchor: 'bottom',
  }).setHTML(`
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
};