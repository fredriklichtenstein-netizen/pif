
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
 * Converts a distance in meters to degrees at a specific latitude
 * This is necessary because the length of a degree of longitude varies with latitude
 */
export const metersToDegreesAtLatitude = (meters: number, latitude: number): { latDegrees: number, lngDegrees: number } => {
  // Earth's radius in meters
  const earthRadius = 6378137;
  
  // Convert latitude from degrees to radians
  const latRad = latitude * Math.PI / 180;
  
  // Calculate meters per degree of latitude (roughly constant)
  // 111,000 meters per degree at the equator, slightly less at higher latitudes
  const metersPerLatDegree = 111320; // This is an approximation
  
  // Calculate meters per degree of longitude (varies with latitude)
  // At the equator it's also about 111,000m, but shrinks to 0 at the poles
  const metersPerLngDegree = Math.cos(latRad) * earthRadius * (Math.PI / 180);
  
  // Convert meters to degrees
  const latDegrees = meters / metersPerLatDegree;
  const lngDegrees = meters / metersPerLngDegree;
  
  return { latDegrees, lngDegrees };
};

/**
 * Adds intentional variance to coordinates for privacy
 * Uses smaller radius in urban areas and larger in rural areas
 * Accurately converts meters to degrees based on latitude
 */
export const addLocationPrivacy = async (lng: number, lat: number, map?: mapboxgl.Map): Promise<[number, number]> => {
  // Check cache first
  const cacheKey = `${lng},${lat}`;
  const cachedValue = coordinateCache.get(cacheKey);
  if (cachedValue) {
    console.log('Using cached privacy coordinates for:', cacheKey);
    return cachedValue;
  }

  // Define privacy radii in meters
  const URBAN_RADIUS_METERS = 100;  // 100 meters in urban areas
  const RURAL_RADIUS_METERS = 1500; // 1.5 km in rural areas
  
  const isUrbanLocation = await isUrbanArea(lat, lng, undefined, map);
  const radiusMeters = isUrbanLocation ? URBAN_RADIUS_METERS : RURAL_RADIUS_METERS;
  
  console.log(`Privacy radius for [${lng}, ${lat}]: ${isUrbanLocation ? 'urban' : 'rural'} = ${radiusMeters} meters`);
  
  // Convert meters to degrees at this latitude
  const { latDegrees, lngDegrees } = metersToDegreesAtLatitude(radiusMeters, lat);
  
  // Generate deterministic offset
  const maxAttempts = 10;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate a seed that depends on the coordinates but varies with the attempt number
    const seed = Math.sin((lat * lng) + (attempt * 0.1)) * 10000;
    const angle = seed * Math.PI * 2;
    
    // Use the angle to determine direction, but scale the distance based on lat/lng degrees
    const distance = Math.abs(Math.cos(seed)); // Value between 0 and 1
    
    // Apply the offset with proper scaling for lat/lng
    const offsetLng = distance * lngDegrees * Math.cos(angle);
    const offsetLat = distance * latDegrees * Math.sin(angle);
    
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
                  'Attempt:', attempt + 1,
                  'Approx distance (m):', distance * radiusMeters);
      
      return result;
    } else {
      console.log(`Rejected water location at [${privateLng}, ${privateLat}], attempt ${attempt + 1}`);
    }
  }
  
  // If we couldn't find a non-water location after max attempts, use a minimal offset
  const minimalRadius = URBAN_RADIUS_METERS * 0.5;
  const { latDegrees: minLatDegrees, lngDegrees: minLngDegrees } = 
    metersToDegreesAtLatitude(minimalRadius, lat);
  
  const minimalSeed = Math.sin(lat * lng) * 10000;
  const minimalAngle = minimalSeed * Math.PI * 2;
  const minimalDistance = Math.abs(Math.cos(minimalSeed));
  
  const minimalOffsetLng = minimalDistance * minLngDegrees * Math.cos(minimalAngle);
  const minimalOffsetLat = minimalDistance * minLatDegrees * Math.sin(minimalAngle);
  
  const result: [number, number] = [lng + minimalOffsetLng, lat + minimalOffsetLat];
  
  // Cache the result
  coordinateCache.set(cacheKey, result);
  console.log('Using minimal privacy offset after water detection failed:', 
              'Original:', [lng, lat], 
              'Adjusted:', result);
  
  return result;
};
