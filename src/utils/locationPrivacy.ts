import mapboxgl, { Point } from "mapbox-gl";
import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if coordinates are within an urban area based on Mapbox infrastructure data
 * Uses building density, road network, and land use classification
 * Falls back to database of Swedish urban areas if infrastructure data isn't available
 */
export const isUrbanArea = async (lat: number, lng: number, _mapZoom?: number, map?: mapboxgl.Map): Promise<boolean> => {
  // If map object is provided, use infrastructure data
  if (map && map.isStyleLoaded()) {
    try {
      // Convert lat/lng to pixel coordinates for querying features
      const point = map.project([lng, lat]);
      
      // Create two points for the bounding box
      const sw: Point = new Point(point.x - 100, point.y + 100);
      const ne: Point = new Point(point.x + 100, point.y - 100);

      // Get all relevant features within the bounding box
      const features = map.queryRenderedFeatures([sw, ne], {
        layers: [
          'building',          // Building footprints
          'road',             // Road networks
          'landuse'           // Land use classifications
        ]
      });

      // Count buildings
      const buildingCount = features.filter(f => 
        f.sourceLayer === 'building' || 
        f.layer.type === 'fill' && f.layer.id.includes('building')
      ).length;

      // Count road segments
      const roadCount = features.filter(f => 
        f.sourceLayer === 'road' || 
        f.layer.type === 'line' && f.layer.id.includes('road')
      ).length;

      // Check landuse types
      const ruralLandUseTypes = ['agriculture', 'forest', 'grass', 'meadow', 'farmland'];
      const hasRuralLanduse = features.some(f => 
        f.sourceLayer === 'landuse' && 
        ruralLandUseTypes.includes(f.properties?.class as string)
      );

      // Urban if: many buildings OR (multiple roads AND not rural)
      const isUrban = (buildingCount > 5 || (roadCount >= 2 && !hasRuralLanduse));

      console.log(`Location analysis at [${lng}, ${lat}]:`, {
        buildingCount,
        roadCount,
        hasRuralLanduse,
        isUrban
      });

      return isUrban;
    } catch (error) {
      console.error("Error determining urban area:", error);
      // Fall back to database check
    }
  }
  
  // Fallback: Check against database of Swedish urban areas
  const { data, error } = await supabase
    .from('swedish_urban_areas')
    .select('id')
    .gte('min_lat', lat)
    .lte('max_lat', lat)
    .gte('min_lng', lng)
    .lte('max_lng', lng)
    .limit(1);

  if (error) {
    console.error("Error checking urban areas database:", error);
    return false;
  }

  return data.length > 0;
};

// Cache for privacy-adjusted coordinates
const coordinateCache = new Map<string, [number, number]>();

/**
 * Adds intentional variance to coordinates for privacy
 * Uses smaller radius in urban areas (+-100m) and larger in rural areas (+-5km)
 */
export const addLocationPrivacy = async (lng: number, lat: number): Promise<[number, number]> => {
  // Check cache first
  const cacheKey = `${lng},${lat}`;
  const cachedValue = coordinateCache.get(cacheKey);
  if (cachedValue) {
    console.log('Using cached privacy coordinates for:', cacheKey);
    return cachedValue;
  }

  // Define radii in degrees (approximate conversion)
  const URBAN_RADIUS = 0.0005; // ~100m at these latitudes
  const RURAL_RADIUS = 0.045; // ~5km
  
  const isUrbanLocation = await isUrbanArea(lat, lng);
  const radius = isUrbanLocation ? URBAN_RADIUS : RURAL_RADIUS;
  
  // Generate a deterministic offset based on the coordinates
  // This ensures the same coordinates always get the same offset
  const seed = Math.sin(lat * lng) * 10000;
  const angle = seed * Math.PI * 2;
  const distance = Math.abs(Math.cos(seed)) * radius;
  
  const offsetLng = distance * Math.cos(angle);
  const offsetLat = distance * Math.sin(angle);
  
  const result: [number, number] = [
    lng + offsetLng,
    lat + offsetLat
  ];

  // Cache the result
  coordinateCache.set(cacheKey, result);
  console.log('Cached new privacy coordinates for:', cacheKey);
  
  return result;
};
