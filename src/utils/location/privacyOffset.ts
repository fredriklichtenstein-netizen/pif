
import { isUrbanArea } from "./urbanDetection";
import { isWaterLocation } from "./waterDetection";
import { getCachedCoordinates, cacheCoordinates } from "./coordinateCache";

/**
 * Adds privacy offset to coordinates based on urban density
 * Returns adjusted coordinates [lng, lat]
 * 
 * @param lng - Longitude value
 * @param lat - Latitude value
 * @param map - Optional Mapbox map instance for water detection
 */
export async function addLocationPrivacy(
  lng: number, 
  lat: number,
  map?: mapboxgl.Map | null
): Promise<[number, number]> {
  try {
    // Validate input coordinates
    if (isNaN(lng) || isNaN(lat)) {
      console.error("Invalid coordinates for privacy calculation:", { lng, lat });
      throw new Error("Invalid coordinates provided for privacy calculation");
    }
    
    console.log("Adding privacy to coordinates:", { lng, lat });
    
    // Check if we have cached coordinates for this location
    // Generate consistent cache key by rounding to 6 decimal places for consistent lookups
    const roundedLng = Math.round(lng * 1000000) / 1000000;
    const roundedLat = Math.round(lat * 1000000) / 1000000;
    const cached = getCachedCoordinates(roundedLng, roundedLat);
    
    if (cached) {
      console.log('Using cached privacy coordinates for location:', { 
        original: [roundedLng, roundedLat],
        cached
      });
      return cached;
    }
    
    // Check if location is in an urban area
    const isUrban = await isUrbanArea(lat, lng);
    
    // Determine privacy radius based on location type
    // Urban areas use smaller radius (higher density of potential PIF users)
    const privacyRadiusUrban = 300; // meters for urban areas
    const privacyRadiusRural = 800; // meters for rural areas
    
    const privacyRadius = isUrban ? privacyRadiusUrban : privacyRadiusRural;
    console.log(`Location is ${isUrban ? 'urban' : 'rural'}, using radius: ${privacyRadius}m`);
    
    // For deterministic results, use a seeded random based on coordinates
    // This ensures the same input coordinates always produce the same offset
    // while still appearing random to outside observers
    const coordSeed = (roundedLng * 1000000) + (roundedLat * 1000);
    const seededRandom = createSeededRandom(coordSeed);
    
    // Calculate privacy offset using seeded random
    const offsetMeters = seededRandom() * privacyRadius;
    const angle = seededRandom() * 2 * Math.PI; // Random angle in radians
    
    console.log(`Generated offset: ${offsetMeters.toFixed(2)}m at angle ${(angle * 180 / Math.PI).toFixed(2)}°`);
    
    // Convert meters to approximate degrees (simple calculation)
    // 1 degree lat ~= 111km, 1 degree lng ~= 111km * cos(lat)
    const latOffset = offsetMeters / 111000;
    const lngOffset = offsetMeters / (111000 * Math.cos(lat * Math.PI / 180));
    
    // Apply the offset
    let adjustedLng = lng + lngOffset * Math.cos(angle);
    let adjustedLat = lat + latOffset * Math.sin(angle);
    
    // Check if new location is in water, if so retry up to 3 times
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      // If map is provided, use it for water detection
      const isWater = map ? await isWaterLocation(adjustedLng, adjustedLat, map) : await isWaterLocation(adjustedLng, adjustedLat);
      
      if (!isWater) {
        break; // Found a valid location
      }
      
      console.log('Privacy offset landed in water, retrying...');
      
      // Calculate new offset with smaller radius each attempt, using the same seeded random
      const retryRadius = privacyRadius * (1 - (attempts + 1) / maxAttempts);
      const retryOffset = seededRandom() * retryRadius;
      const retryAngle = seededRandom() * 2 * Math.PI;
      
      const retryLatOffset = retryOffset / 111000;
      const retryLngOffset = retryOffset / (111000 * Math.cos(lat * Math.PI / 180));
      
      adjustedLng = lng + retryLngOffset * Math.cos(retryAngle);
      adjustedLat = lat + retryLatOffset * Math.sin(retryAngle);
      
      attempts++;
    }
    
    console.log("Original coordinates:", { lng, lat });
    console.log("Privacy-adjusted coordinates:", { lng: adjustedLng, lat: adjustedLat });
    
    // Cache the result with rounded input coordinates
    const result: [number, number] = [adjustedLng, adjustedLat];
    cacheCoordinates(roundedLng, roundedLat, result);
    
    return result;
  } catch (error) {
    console.error('Error in privacy offset calculation:', error);
    // In case of error, return original coordinates with minimal offset
    const minimalOffsetLng = lng + (Math.random() - 0.5) * 0.001;
    const minimalOffsetLat = lat + (Math.random() - 0.5) * 0.001;
    console.log("Using minimal offset due to error:", { lng: minimalOffsetLng, lat: minimalOffsetLat });
    return [minimalOffsetLng, minimalOffsetLat];
  }
}

/**
 * Creates a seeded random number generator
 * This ensures that privacy offsets are consistent for the same coordinates
 */
function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    // Simple xorshift algorithm for pseudorandom number generation
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    
    // Normalize to [0, 1] interval
    const result = Math.abs((state % 1000000) / 1000000);
    return result;
  };
}
