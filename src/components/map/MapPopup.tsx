
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
  // Create a popup with precise configuration
  const popup = new mapboxgl.Popup({
    offset: 12,
    closeButton: false,
    anchor: 'bottom',
    maxWidth: '140px',
    className: 'map-item-popup',
  });

  // Create HTML content with a unified design (no separate borders/shadows between image and title)
  popup.setHTML(`
    <div style="
      width: 140px; 
      max-width: 140px; 
      overflow: hidden; 
      box-sizing: border-box; 
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      transform: translateX(-50%);
      left: 50%;
      position: relative;
      margin: 0 auto;
      background: white;
    ">
      <div style="
        width: 140px; 
        height: 100px; 
        overflow: hidden; 
        box-sizing: border-box;
        position: relative;
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
        padding: 8px 8px; 
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
          color: #333;
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
