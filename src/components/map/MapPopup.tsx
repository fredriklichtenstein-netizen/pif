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
    offset: 20,
    closeButton: false,
    anchor: 'bottom',
    maxWidth: '180px',
    className: 'map-item-popup enhanced-popup',
  });

  const isWish = post.item_type === 'request';
  const typeColor = isWish ? '#F59E0B' : '#0D9488';
  const typeIcon = isWish ? '★' : '🎁';

  const hasImage = post.images && post.images.length > 0 && post.images[0];
  const imageUrl = hasImage ? post.images[0] : '';
  const isValidImageUrl = imageUrl &&
    (imageUrl.startsWith('http') || imageUrl.startsWith('data:') || imageUrl.startsWith('/'));

  const fallbackBg = isWish
    ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)'
    : 'linear-gradient(135deg, #CCFBF1 0%, #99F6E4 100%)';

  const innerContent = isValidImageUrl
    ? `<img
        src="${imageUrl}"
        alt=""
        style="width:100%;height:100%;object-fit:cover;display:block;"
        onerror="this.style.display='none'; this.parentNode.style.background='${fallbackBg}';"
      />`
    : `<div style="width:100%;height:100%;background:${fallbackBg};"></div>`;

  popup.setHTML(`
    <div style="
      width:160px;
      height:160px;
      position:relative;
      border-radius:16px;
      overflow:hidden;
      box-shadow:0 8px 32px rgba(0,0,0,0.18);
      background:white;
    ">
      ${innerContent}
      <div style="
        position:absolute;
        top:8px;
        left:8px;
        width:28px;
        height:28px;
        border-radius:50%;
        background:${typeColor};
        color:white;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:14px;
        font-weight:700;
        box-shadow:0 2px 6px rgba(0,0,0,0.25);
        border:2px solid white;
      ">${typeIcon}</div>
    </div>
  `);

  popup.setLngLat([displayCoordinates.lng, displayCoordinates.lat]);

  return popup;
};
