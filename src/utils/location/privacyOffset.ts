
import mapboxgl from "mapbox-gl";
import { isUrbanArea } from "./urbanDetection";
import { isWaterLocation } from "./waterDetection";
import { getCachedCoordinates, cacheCoordinates } from "./coordinateCache";

/**
 * Adds intentional variance to coordinates for privacy
 * Uses smaller radius in urban areas and larger in rural areas
 * Values expressed directly in degrees to avoid conversion errors
 */
export const addLocationPrivacy = async (lng: number, lat: number, map?: mapboxgl.Map): Promise<[number, number]> => {
  // Valid input check
  if (isNaN(lng) || isNaN(lat)) {
    console.error('Invalid coordinates provided to addLocationPrivacy:', lng, lat);
    return [lng || 0, lat || 0]; // Return input or default to prevent crashes
  }

  // Debug logging
  console.log('Adding privacy to coordinates:', lng, lat);

  // Check cache first
  const cachedValue = getCachedCoordinates(lng, lat);
  if (cachedValue) {
    console.log('Using cached privacy coordinates for:', `${lng},${lat}`);
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
      cacheCoordinates(lng, lat, result);
      console.log('Generated privacy coordinates', 
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
  cacheCoordinates(lng, lat, result);
  console.log('Using minimal privacy offset after water detection failed:', 
              'Original:', [lng, lat], 
              'Adjusted:', result);
  
  return result;
};
