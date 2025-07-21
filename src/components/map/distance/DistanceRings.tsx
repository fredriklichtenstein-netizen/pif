
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface DistanceRingsProps {
  map: mapboxgl.Map;
  center: [number, number] | null;
  visible: boolean;
  rings?: number[]; // distances in km
}

export const DistanceRings = ({ map, center, visible, rings = [1, 5, 10] }: DistanceRingsProps) => {
  const ringsAdded = useRef(false);

  useEffect(() => {
    if (!map || !center || !visible) {
      removeRings();
      return;
    }

    addRings();
    
    return () => removeRings();
  }, [map, center, visible, rings]);

  const addRings = () => {
    if (!map || !center || ringsAdded.current) return;

    try {
      rings.forEach((distance, index) => {
        const sourceId = `distance-ring-${distance}`;
        const layerId = `distance-ring-layer-${distance}`;

        // Create circle geometry
        const circle = createCircle(center, distance);
        
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: circle,
              properties: { distance }
            }
          });
        }

        if (!map.getLayer(layerId)) {
          map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': '#3b82f6',
              'line-width': 2,
              'line-opacity': 0.6 - (index * 0.15)
            }
          });
        }
      });
      
      ringsAdded.current = true;
    } catch (error) {
      console.error('Error adding distance rings:', error);
    }
  };

  const removeRings = () => {
    if (!map || !ringsAdded.current) return;

    try {
      rings.forEach((distance) => {
        const sourceId = `distance-ring-${distance}`;
        const layerId = `distance-ring-layer-${distance}`;

        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      });
      
      ringsAdded.current = false;
    } catch (error) {
      console.error('Error removing distance rings:', error);
    }
  };

  const createCircle = (center: [number, number], radiusKm: number) => {
    const points = 64;
    const coords: number[][] = [];
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const dx = radiusKm * Math.cos(angle);
      const dy = radiusKm * Math.sin(angle);
      
      // Convert km to degrees (approximate)
      const deltaLat = dy / 110.54;
      const deltaLng = dx / (110.54 * Math.cos(center[1] * Math.PI / 180));
      
      coords.push([center[0] + deltaLng, center[1] + deltaLat]);
    }
    
    // Close the ring
    coords.push(coords[0]);
    
    return {
      type: 'Polygon',
      coordinates: [coords]
    };
  };

  return null;
};
