
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
  // Create a popup with specific configuration
  const popup = new mapboxgl.Popup({
    offset: 12,
    closeButton: false,
    anchor: 'bottom',
    maxWidth: '140px',
    className: 'map-item-popup',
  });

  // Create HTML content with proper containment
  // The key fix is ensuring consistent width constraints and explicit overflow handling
  popup.setHTML(`
    <div style="
      width: 140px; 
      max-width: 140px; 
      overflow: hidden; 
      box-sizing: border-box; 
      border-radius: 4px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    ">
      <div style="
        width: 140px; 
        height: 100px; 
        overflow: hidden; 
        box-sizing: border-box;
        position: relative;
        background: #f5f5f5;
      ">
        <img 
          src="${post.images[0]}" 
          alt="${post.title}" 
          style="
            width: 100%; 
            height: 100%; 
            object-fit: cover; 
            box-sizing: border-box;
            display: block;
          "
        />
      </div>
      <div style="
        width: 140px; 
        height: 30px; 
        display: flex; 
        align-items: center; 
        padding: 0 8px; 
        background: white; 
        box-sizing: border-box;
      ">
        <h3 style="
          margin: 0; 
          padding: 0;
          font-size: 11px; 
          font-weight: 600; 
          white-space: nowrap; 
          overflow: hidden; 
          text-overflow: ellipsis; 
          width: 100%;
        ">
          ${post.title}
        </h3>
      </div>
    </div>
  `);

  // Set the popup location to the privacy-adjusted coordinates
  popup.setLngLat([displayCoordinates.lng, displayCoordinates.lat]);

  return popup;
};
