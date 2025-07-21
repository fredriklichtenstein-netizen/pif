
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
  // Create an enhanced popup with better styling
  const popup = new mapboxgl.Popup({
    offset: 15,
    closeButton: false,
    anchor: 'bottom',
    maxWidth: '200px',
    className: 'map-item-popup enhanced-popup',
  });

  // Determine correct item type label
  const getItemTypeLabel = (itemType: string | undefined): string => {
    if (!itemType) return 'Erbjuder'; // Default fallback
    
    // Handle both 'offer'/'request' and 'erbjuder'/'söker' formats
    const normalizedType = itemType.toLowerCase();
    
    if (normalizedType === 'offer' || normalizedType === 'erbjuder') {
      return 'Erbjuder';
    } else if (normalizedType === 'request' || normalizedType === 'söker') {
      return 'Söker';
    }
    
    // Fallback based on common patterns
    return normalizedType.includes('sök') || normalizedType.includes('request') ? 'Söker' : 'Erbjuder';
  };

  // Create enhanced HTML content with better styling and more information
  const hasImage = post.images && post.images.length > 0;
  const condition = post.condition ? post.condition.charAt(0).toUpperCase() + post.condition.slice(1) : '';
  const category = post.category ? post.category.charAt(0).toUpperCase() + post.category.slice(1) : '';
  const itemTypeLabel = getItemTypeLabel(post.item_type);
  
  console.log('Popup - Item type:', post.item_type, 'Label:', itemTypeLabel);
  
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
      ${hasImage ? `
        <div style="
          width: 180px; 
          height: 120px; 
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
            onerror="this.style.display='none'; this.parentNode.innerHTML='<div style=\\"width: 100%; height: 100%; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); display: flex; align-items: center; justify-content: center; color: #0284c7; font-size: 14px; font-weight: 600;\\">📦 ${itemTypeLabel}</div>';"
          />
          <div style="
            position: absolute;
            top: 8px;
            right: 8px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 500;
          ">
            ${itemTypeLabel}
          </div>
        </div>
      ` : `
        <div style="
          width: 180px; 
          height: 80px; 
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          <div style="
            color: #0284c7;
            font-size: 14px;
            font-weight: 600;
          ">
            ${itemTypeLabel === 'Erbjuder' ? '📦 Erbjuder' : '🔍 Söker'}
          </div>
          <div style="
            position: absolute;
            top: 8px;
            right: 8px;
            background: rgba(2,132,199,0.9);
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 500;
          ">
            ${itemTypeLabel}
          </div>
        </div>
      `}
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
          font-size: 10px;
          color: #9ca3af;
          text-align: center;
        ">
          Klicka för att visa detaljer
        </div>
      </div>
    </div>
  `);

  // Set the popup location to the privacy-adjusted coordinates
  popup.setLngLat([displayCoordinates.lng, displayCoordinates.lat]);

  return popup;
};
