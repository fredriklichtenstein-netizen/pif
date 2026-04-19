
import mapboxgl from "mapbox-gl";
import type { Post } from "@/types/post";
import { calculateDistanceFromUser, formatDistance } from "@/utils/distance";
import i18n from "@/i18n";

interface MapPopupProps {
  post: Post;
  displayCoordinates: {
    lng: number;
    lat: number;
  };
}

export const createMapPopup = ({ post, displayCoordinates }: MapPopupProps): mapboxgl.Popup => {
  // Create an enhanced popup with better styling
  const popup = new mapboxgl.Popup({
    offset: 20,
    closeButton: false,
    anchor: 'bottom',
    maxWidth: '280px',
    className: 'map-item-popup enhanced-popup',
  });

  // Calculate distance using original post coordinates for accuracy
  const getDistanceText = (): string => {
    try {
      if (!post.coordinates) return '';
      const { lng, lat } = post.coordinates;
      if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) return '';
      const distance = calculateDistanceFromUser(lng, lat);
      if (isNaN(distance) || distance < 0) return '';
      return formatDistance(distance);
    } catch (error) {
      console.error('Error calculating distance for popup:', error);
      return '';
    }
  };

  const distanceText = getDistanceText();

  // Determine correct item type label and colors
  const isWish = post.item_type === 'request';
  const typeColor = isWish ? '#F59E0B' : '#0D9488';
  const typeBgColor = isWish ? 'rgba(245, 158, 11, 0.95)' : 'rgba(13, 148, 136, 0.95)';
  
  const getItemTypeLabel = (itemType: string | undefined): string => {
    if (!itemType) return 'Pif';
    const normalizedType = itemType.toLowerCase();
    if (normalizedType === 'offer' || normalizedType === 'erbjuder') return 'Pif';
    if (normalizedType === 'request' || normalizedType === 'söker') return 'Önskning';
    return normalizedType.includes('sök') || normalizedType.includes('request') ? 'Önskning' : 'Pif';
  };

  const itemTypeLabel = getItemTypeLabel(post.item_type);
  const conditionRaw = post.condition || '';
  const conditionTranslated = conditionRaw ? i18n.t(`conditions.${conditionRaw}`, { defaultValue: conditionRaw.charAt(0).toUpperCase() + conditionRaw.slice(1) }) : '';
  const condition = conditionTranslated;
  const category = post.category ? post.category.charAt(0).toUpperCase() + post.category.slice(1) : '';

  // Enhanced image handling with larger thumbnail
  const getImageHtml = (): string => {
    const hasImage = post.images && post.images.length > 0 && post.images[0];
    
    if (hasImage) {
      const imageUrl = post.images[0];
      const isValidImageUrl = imageUrl && 
        (imageUrl.startsWith('http') || imageUrl.startsWith('data:') || imageUrl.startsWith('/'));
      
      if (isValidImageUrl) {
        return `
          <div style="
            width: 100%; 
            height: 160px; 
            overflow: hidden; 
            position: relative;
            background: #f3f4f6;
          ">
            <img 
              src="${imageUrl}" 
              alt="${post.title}" 
              style="
                width: 100%; 
                height: 100%; 
                object-fit: cover; 
                display: block;
              "
              onerror="this.style.display='none'; this.parentNode.style.height='100px'; this.parentNode.innerHTML='<div style=\\"width: 100%; height: 100%; background: ${isWish ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' : 'linear-gradient(135deg, #CCFBF1 0%, #99F6E4 100%)'}; display: flex; align-items: center; justify-content: center;\\"><span style=\\"color: ${typeColor}; font-size: 32px;\\">${isWish ? '🔍' : '🎁'}</span></div>';"
            />
            <div style="
              position: absolute;
              top: 10px;
              left: 10px;
              background: ${typeBgColor};
              color: white;
              padding: 4px 10px;
              border-radius: 8px;
              font-size: 12px;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 5px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            ">
              ${isWish ? '🔍' : '🎁'} ${itemTypeLabel}
            </div>
          </div>
        `;
      }
    }
    
    // Fallback for no image
    return `
      <div style="
        width: 100%; 
        height: 100px; 
        background: ${isWish ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' : 'linear-gradient(135deg, #CCFBF1 0%, #99F6E4 100%)'};
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <span style="font-size: 32px;">${isWish ? '🔍' : '🎁'}</span>
        <div style="
          position: absolute;
          top: 10px;
          left: 10px;
          background: ${typeBgColor};
          color: white;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        ">
          ${itemTypeLabel}
        </div>
      </div>
    `;
  };

  popup.setHTML(`
    <div style="
      width: 260px; 
      max-width: 260px; 
      overflow: hidden; 
      box-sizing: border-box; 
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      background: white;
      border: 1px solid rgba(0,0,0,0.06);
    ">
      ${getImageHtml()}
      <div style="padding: 14px 16px 16px;">
        <h3 style="
          margin: 0 0 8px 0; 
          font-size: 15px; 
          font-weight: 700; 
          line-height: 1.35;
          color: #111827;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        ">
          ${post.title}
        </h3>
        ${post.description ? `
          <p style="
            margin: 0 0 12px 0;
            font-size: 12px;
            color: #6b7280;
            line-height: 1.5;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          ">
            ${post.description}
          </p>
        ` : ''}
        <div style="
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        ">
          ${category ? `
            <span style="
              background: #f3f4f6;
              color: #374151;
              padding: 4px 10px;
              border-radius: 8px;
              font-size: 11px;
              font-weight: 600;
            ">
              ${category}
            </span>
          ` : ''}
          ${condition ? `
            <span style="
              background: #ecfdf5;
              color: #065f46;
              padding: 4px 10px;
              border-radius: 8px;
              font-size: 11px;
              font-weight: 600;
            ">
              ${condition}
            </span>
          ` : ''}
        </div>
        <div style="
          padding-top: 10px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          ${distanceText ? `
            <span style="
              font-size: 11px;
              color: #6b7280;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              📍 ${distanceText}
            </span>
          ` : '<span></span>'}
          <span style="
            font-size: 11px;
            color: ${typeColor};
            font-weight: 600;
          ">
            Klicka för detaljer →
          </span>
        </div>
      </div>
    </div>
  `);

  popup.setLngLat([displayCoordinates.lng, displayCoordinates.lat]);

  return popup;
};
