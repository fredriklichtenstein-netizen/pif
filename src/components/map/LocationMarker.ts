
import mapboxgl from "mapbox-gl";

export const createLocationMarker = (map: mapboxgl.Map, lngLat: [number, number]): mapboxgl.Marker => {
  const el = document.createElement('div');
  el.className = 'location-marker';
  
  const style = document.createElement('style');
  style.textContent = `
    .location-marker {
      width: 24px;
      height: 24px;
      position: relative;
    }
    .location-marker::before {
      content: '';
      position: absolute;
      width: 24px;
      height: 24px;
      background: rgba(37, 99, 235, 0.2);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    .location-marker::after {
      content: '';
      position: absolute;
      width: 12px;
      height: 12px;
      background: rgb(37, 99, 235);
      border: 2px solid white;
      border-radius: 50%;
      top: 6px;
      left: 6px;
      box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
    }
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(3); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  return new mapboxgl.Marker({
    element: el,
    anchor: 'center'
  })
    .setLngLat(lngLat)
    .addTo(map);
};
