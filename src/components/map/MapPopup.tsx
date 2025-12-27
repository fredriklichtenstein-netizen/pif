
import mapboxgl from "mapbox-gl";
import type { Post } from "@/types/post";
import { calculateDistanceFromUser, formatDistance } from "@/utils/distance";

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
    offset: 15,
    closeButton: false,
    anchor: 'bottom',
    maxWidth: '200px',
    className: 'map-item-popup enhanced-popup',
  });

  // Calculate distance using original post coordinates for accuracy
  const getDistanceText = (): string => {
    try {
      if (!post.coordinates) {
        console.log('No coordinates available for distance calculation');
        return '';
      }
      
      const { lng, lat } = post.coordinates;
      
      if (typeof lng !== 'number' || typeof lat !== 'number' || 
          isNaN(lng) || isNaN(lat)) {
        console.log('Invalid coordinates for distance calculation:', { lng, lat });
        return '';
      }
      
      const distance = calculateDistanceFromUser(lng, lat);
      
      if (isNaN(distance) || distance < 0) {
        console.log('Invalid distance result:', distance);
        return '';
      }
      
      return formatDistance(distance);
    } catch (error) {
      console.error('Error calculating distance for popup:', error);
      return '';
    }
  };

  const distanceText = getDistanceText();

  // Determine correct item type label and colors
  const isWish = post.item_type === 'request';
  const typeColor = isWish ? '#F59E0B' : '#0D9488'; // amber for wishes, teal for pifs
  const typeBgColor = isWish ? 'rgba(245, 158, 11, 0.9)' : 'rgba(13, 148, 136, 0.9)';
  
  const getItemTypeLabel = (itemType: string | undefined): string => {
    if (!itemType) return 'Pif';
    const normalizedType = itemType.toLowerCase();
    if (normalizedType === 'offer' || normalizedType === 'erbjuder') {
      return 'Pif';
    } else if (normalizedType === 'request' || normalizedType === 'söker') {
      return 'Önskning';
    }
    return normalizedType.includes('sök') || normalizedType.includes('request') ? 'Önskning' : 'Pif';
  };

  // Enhanced image handling with better fallback
  const getImageHtml = (): string => {
    const hasImage = post.images && post.images.length > 0 && post.images[0];
    const itemTypeLabel = getItemTypeLabel(post.item_type);
    
    if (hasImage) {
      const imageUrl = post.images[0];
      
      // Check if it's a valid URL format
      const isValidImageUrl = imageUrl && 
        (imageUrl.startsWith('http') || imageUrl.startsWith('data:') || imageUrl.startsWith('/'));
      
      if (isValidImageUrl) {
        return `
          <div style="
            width: 180px; 
            height: 120px; 
            overflow: hidden; 
            box-sizing: border-box;
            position: relative;
          ">
            <img 
              src="${imageUrl}" 
              alt="${post.title}" 
              style="
                width: 100%; 
                height: 100%; 
                object-fit: cover; 
                box-sizing: border-box;
                display: block;
              "
              onerror="this.style.display='none'; this.parentNode.innerHTML='<div style=\\"width: 100%; height: 100%; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); display: flex; align-items: center; justify-content: center; color: #0284c7; font-size: 14px; font-weight: 600;\\">📦 ${itemTypeLabel}</div>';"
            />
            <div style="
              position: absolute;
              top: 8px;
              right: 8px;
              background: ${typeBgColor};
              color: white;
              padding: 3px 8px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              ${isWish ? '🔍' : '🎁'} ${itemTypeLabel}
            </div>
          </div>
        `;
      }
    }
    
    // Fallback for no image or invalid image
    return `
      <div style="
        width: 180px; 
        height: 80px; 
        background: ${isWish ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' : 'linear-gradient(135deg, #CCFBF1 0%, #99F6E4 100%)'};
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <div style="
          color: ${typeColor};
          font-size: 14px;
          font-weight: 600;
        ">
          ${isWish ? '🔍 Önskning' : '🎁 Pif'}
        </div>
        <div style="
          position: absolute;
          top: 8px;
          right: 8px;
          background: ${typeBgColor};
          color: white;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
        ">
          ${itemTypeLabel}
        </div>
      </div>
    `;
  };

  // Create enhanced HTML content with better styling and more information
  const condition = post.condition ? post.condition.charAt(0).toUpperCase() + post.condition.slice(1) : '';
  const category = post.category ? post.category.charAt(0).toUpperCase() + post.category.slice(1) : '';
  
  console.log('Popup - Item type:', post.item_type, 'Distance:', distanceText);
  
  popup.setHTML(`
    <div style="
      width: 180px; 
      max-width: 180px; 
      overflow: hidden; 
      box-sizing: border-box; 
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      transform: translateX(-50%);
      left: 50%;
      position: relative;
      margin: 0 auto;
      background: white;
      border: 1px solid rgba(0,0,0,0.08);
    ">
      ${getImageHtml()}
      <div style="
        width: 180px; 
        padding: 12px; 
        box-sizing: border-box;
      ">
        <h3 style="
          margin: 0 0 6px 0; 
          padding: 0;
          font-size: 13px; 
          font-weight: 600; 
          line-height: 1.3;
          color: #1f2937;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        ">
          ${post.title}
        </h3>
        ${post.description ? `
          <p style="
            margin: 0 0 8px 0;
            font-size: 11px;
            color: #6b7280;
            line-height: 1.4;
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
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 6px;
        ">
          ${category ? `
            <span style="
              background: #f3f4f6;
              color: #374151;
              padding: 2px 6px;
              border-radius: 6px;
              font-size: 10px;
              font-weight: 500;
            ">
              ${category}
            </span>
          ` : ''}
          ${condition ? `
            <span style="
              background: #ecfdf5;
              color: #065f46;
              padding: 2px 6px;
              border-radius: 6px;
              font-size: 10px;
              font-weight: 500;
            ">
              ${condition}
            </span>
          ` : ''}
        </div>
        <div style="
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #f3f4f6;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          ${distanceText ? `
            <span style="
              font-size: 10px;
              color: #6b7280;
              font-weight: 500;
            ">
              ${distanceText}
            </span>
          ` : '<span></span>'}
          <span style="
            font-size: 10px;
            color: #9ca3af;
          ">
            Klicka för att visa detaljer
          </span>
        </div>
      </div>
    </div>
  `);

  // Set the popup location to the privacy-adjusted coordinates
  popup.setLngLat([displayCoordinates.lng, displayCoordinates.lat]);

  return popup;
};
