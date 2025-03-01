
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
    offset: 12,
    closeButton: false,
    anchor: 'bottom',
    maxWidth: '140px', // Fixed maximum width
    className: 'map-item-popup', // Add a custom class for additional styling
  });

  // Set fixed-size popup content with minimal padding
  popup.setHTML(`
    <div class="map-popup-container" style="width: 140px; height: 130px; overflow: hidden; box-sizing: border-box; padding: 0; margin: 0;">
      <div style="width: 100%; height: 100px; overflow: hidden; box-sizing: border-box;">
        <img 
          src="${post.images[0]}" 
          alt="${post.title}" 
          style="width: 100%; height: 100%; object-fit: cover; display: block;"
        />
      </div>
      <div style="height: 30px; display: flex; align-items: center; padding: 0 4px; background: white; box-sizing: border-box;">
        <h3 style="margin: 0; font-size: 11px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">
          ${post.title}
        </h3>
      </div>
    </div>
  `);

  // Use privacy-adjusted coordinates for map display
  popup.setLngLat([displayCoordinates.lng, displayCoordinates.lat]);

  return popup;
};
