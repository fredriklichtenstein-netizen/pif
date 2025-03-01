
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

/**
 * Checks if coordinates are on water (sea, lake, river, etc.)
 */
export const isWaterLocation = async (lng: number, lat: number, map?: mapboxgl.Map): Promise<boolean> => {
  // If map object is provided, use it to check water features
  if (map && map.isStyleLoaded()) {
    try {
      // Convert lat/lng to pixel coordinates for querying features
      const point = map.project([lng, lat]);
      
      // Query for water features at the exact point
      const features = map.queryRenderedFeatures(point, {
        layers: [
          'water',
          'waterway',
          'water-area',
          'water-name',
          'water-point'
        ]
      });

      // If any water features are found, consider it a water location
      const isWater = features.some(f => 
        f.sourceLayer === 'water' || 
        f.layer.id.includes('water') ||
        (f.properties && 
          (f.properties.class === 'water' || 
           f.properties.type === 'water' ||
           f.properties.natural === 'water' ||
           f.properties.natural === 'sea' ||
           f.properties.natural === 'lake')
        )
      );

      if (isWater) {
        console.log(`Water detected at [${lng}, ${lat}]`);
      }
      
      return isWater;
    } catch (error) {
      console.error("Error determining water location:", error);
      return false;
    }
  }
  
  // No map available, return false to be safe
  return false;
};

// Cache for privacy-adjusted coordinates
const coordinateCache = new Map<string, [number, number]>();

/**
 * Adds intentional variance to coordinates for privacy
 * Uses smaller radius in urban areas and larger in rural areas
 * Values expressed directly in degrees to avoid conversion errors
 */
export const addLocationPrivacy = async (lng: number, lat: number, map?: mapboxgl.Map): Promise<[number, number]> => {
  // Check cache first
  const cacheKey = `${lng},${lat}`;
  const cachedValue = coordinateCache.get(cacheKey);
  if (cachedValue) {
    console.log('Using cached privacy coordinates for:', cacheKey);
    return cachedValue;
  }

  // Define radii directly in degrees with higher precision
  // In Stockholm (59.33° N): 
  // - 0.001° longitude ≈ 55m
  // - 0.001° latitude ≈ 111m
  const URBAN_RADIUS_DEG = 0.0006; // ~60-70m actual distance at Swedish latitudes
  const RURAL_RADIUS_DEG = 0.0045; // ~500m, reduced for better accuracy
  
  const isUrbanLocation = await isUrbanArea(lat, lng, undefined, map);
  const radius = isUrbanLocation ? URBAN_RADIUS_DEG : RURAL_RADIUS_DEG;
  
  console.log(`Privacy radius for [${lng}, ${lat}]: ${isUrbanLocation ? 'urban' : 'rural'} = ${radius} degrees`);
  
  // Generate deterministic offset
  const maxAttempts = 10;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate a seed that depends on the coordinates but varies with the attempt number
    const seed = Math.sin((lat * lng) + (attempt * 0.1)) * 10000;
    const angle = seed * Math.PI * 2;
    const distance = Math.abs(Math.cos(seed)) * radius;
    
    const offsetLng = distance * Math.cos(angle);
    const offsetLat = distance * Math.sin(angle);
    
    const privateLng = lng + offsetLng;
    const privateLat = lat + offsetLat;

    // Check if the new location is on water
    const isWater = map ? await isWaterLocation(privateLng, privateLat, map) : false;
    
    if (!isWater) {
      // Not on water, we can use this location
      const result: [number, number] = [privateLng, privateLat];
      
      // Cache the result
      coordinateCache.set(cacheKey, result);
      console.log('Cached new privacy coordinates for:', cacheKey, 
                  'Original:', [lng, lat], 
                  'Adjusted:', result, 
                  'Attempt:', attempt + 1);
      
      return result;
    } else {
      console.log(`Rejected water location at [${privateLng}, ${privateLat}], attempt ${attempt + 1}`);
    }
  }
  
  // If we couldn't find a non-water location after max attempts, use the original location
  // with minimal offset for privacy
  const minimalSeed = Math.sin(lat * lng) * 10000;
  const minimalAngle = minimalSeed * Math.PI * 2;
  const minimalDistance = Math.abs(Math.cos(minimalSeed)) * (URBAN_RADIUS_DEG * 0.5);
  
  const minimalOffsetLng = minimalDistance * Math.cos(minimalAngle);
  const minimalOffsetLat = minimalDistance * Math.sin(minimalAngle);
  
  const result: [number, number] = [lng + minimalOffsetLng, lat + minimalOffsetLat];
  
  // Cache the result
  coordinateCache.set(cacheKey, result);
  console.log('Using minimal privacy offset after water detection failed:', 
              'Original:', [lng, lat], 
              'Adjusted:', result);
  
  return result;
};
