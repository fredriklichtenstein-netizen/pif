
import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';

interface DistanceRingsProps {
  map: mapboxgl.Map;
  center: [number, number] | null;
  visible: boolean;
  rings?: number[]; // distances in km
}

const SOURCE_ID = 'distance-radius';
const FILL_LAYER_ID = 'distance-radius-fill';
const LINE_LAYER_ID = 'distance-radius-line';

export const DistanceRings = ({ map, center, visible, rings = [1, 5, 10] }: DistanceRingsProps) => {
  const addedRef = useRef(false);
  const prevRingsKey = useRef('');

  const createCircle = useCallback((center: [number, number], radiusKm: number): GeoJSON.Polygon => {
    const points = 64;
    const coords: number[][] = [];
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const dx = radiusKm * Math.cos(angle);
      const dy = radiusKm * Math.sin(angle);
      const deltaLat = dy / 110.54;
      const deltaLng = dx / (110.54 * Math.cos(center[1] * Math.PI / 180));
      coords.push([center[0] + deltaLng, center[1] + deltaLat]);
    }
    coords.push(coords[0]);
    
    return { type: 'Polygon' as const, coordinates: [coords] };
  }, []);

  const removeAll = useCallback(() => {
    if (!map || !addedRef.current) return;
    try {
      if (map.getLayer(FILL_LAYER_ID)) map.removeLayer(FILL_LAYER_ID);
      if (map.getLayer(LINE_LAYER_ID)) map.removeLayer(LINE_LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      addedRef.current = false;
    } catch (e) {
      console.error('Error removing distance radius:', e);
    }
  }, [map]);

  const addLayers = useCallback((geojson: GeoJSON.Feature) => {
    if (!map) return;
    try {
      if (addedRef.current) {
        const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData(geojson as any);
          return;
        }
      }

      removeAll();

      map.addSource(SOURCE_ID, { type: 'geojson', data: geojson as any });

      map.addLayer({
        id: FILL_LAYER_ID,
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.08
        }
      });

      map.addLayer({
        id: LINE_LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        paint: {
          'line-color': '#3b82f6',
          'line-width': 2,
          'line-opacity': 0.5
        }
      });

      addedRef.current = true;
    } catch (error) {
      console.error('Error adding distance radius:', error);
    }
  }, [map, removeAll]);

  useEffect(() => {
    if (!map || !center || !visible || rings.length === 0) {
      removeAll();
      prevRingsKey.current = '';
      return;
    }

    const radiusKm = rings[rings.length - 1];
    const key = `${center[0]},${center[1]},${radiusKm}`;
    if (key === prevRingsKey.current) return;
    prevRingsKey.current = key;

    const circle = createCircle(center, radiusKm);
    const geojson: GeoJSON.Feature = {
      type: 'Feature',
      geometry: circle,
      properties: { distance: radiusKm }
    };

    const tryAdd = () => {
      if (map.isStyleLoaded()) {
        addLayers(geojson);
      } else {
        map.once('style.load', () => addLayers(geojson));
      }
    };

    tryAdd();

    return () => removeAll();
  }, [map, center, visible, rings, createCircle, removeAll, addLayers]);

  return null;
};
