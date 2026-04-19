
import { isUrbanArea } from "./urbanDetection";
import { isWaterLocation } from "./waterDetection";
import { getCachedCoordinates, cacheCoordinates } from "./coordinateCache";

/**
 * Adds privacy offset to coordinates based on urban density
 * Returns adjusted coordinates [lng, lat]
 * 
 * @param lng - Longitude value
 * @param lat - Latitude value
 * @param map - Optional Mapbox map instance for water detection (not used in current implementation)
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
    // Check if we have cached coordinates for this location
    const cached = getCachedCoordinates(lng, lat);
    if (cached) {
      return cached;
    }
    
    // Check if location is in an urban area (more anonymization needed)
    const isUrban = await isUrbanArea(lat, lng, undefined, map ?? undefined);
    
    // Determine privacy radius based on location type
    // Urban areas use smaller radius (higher density of potential PIF users)
    // These values match what's used across both profile and main map
    const privacyRadiusUrban = 300; // meters for urban areas
    const privacyRadiusRural = 800; // meters for rural areas
    
    const privacyRadius = isUrban ? privacyRadiusUrban : privacyRadiusRural;
    // Calculate privacy offset
    const offsetMeters = Math.random() * privacyRadius;
    const angle = Math.random() * 2 * Math.PI; // Random angle in radians
    
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
      // Calculate new offset with smaller radius each attempt
      const retryRadius = privacyRadius * (1 - (attempts + 1) / maxAttempts);
      const retryOffset = Math.random() * retryRadius;
      const retryAngle = Math.random() * 2 * Math.PI;
      
      const retryLatOffset = retryOffset / 111000;
      const retryLngOffset = retryOffset / (111000 * Math.cos(lat * Math.PI / 180));
      
      adjustedLng = lng + retryLngOffset * Math.cos(retryAngle);
      adjustedLat = lat + retryLatOffset * Math.sin(retryAngle);
      
      attempts++;
    }
    // Cache the result
    const result: [number, number] = [adjustedLng, adjustedLat];
    cacheCoordinates(lng, lat, result);
    
    return result;
  } catch (error) {
    console.error('Error in privacy offset calculation:', error);
    // In case of error, return original coordinates with minimal offset
    const minimalOffsetLng = lng + (Math.random() - 0.5) * 0.001;
    const minimalOffsetLat = lat + (Math.random() - 0.5) * 0.001;
    return [minimalOffsetLng, minimalOffsetLat];
  }
}
