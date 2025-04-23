
import { isUrbanArea } from "./urbanDetection";
import { isWaterLocation } from "./waterDetection";
import { getCachedCoordinates, cacheCoordinates } from "./coordinateCache";

/**
 * Adds privacy offset to coordinates based on urban density
 * Returns adjusted coordinates [lng, lat]
 */
export async function addLocationPrivacy(
  lng: number, 
  lat: number
): Promise<[number, number]> {
  try {
    // Check if we have cached coordinates for this location
    const cached = getCachedCoordinates(lng, lat);
    if (cached) {
      console.log('Using cached privacy coordinates');
      return cached;
    }
    
    // Check if location is in an urban area (more anonymization needed)
    const isUrban = await isUrbanArea(lng, lat);
    
    // Determine privacy radius based on location type (urban = smaller offset)
    // Urban areas have many PIF users, so less offset needed for privacy
    const privacyRadius = isUrban ? 300 : 800; // meters
    
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
      const isWater = await isWaterLocation(adjustedLng, adjustedLat);
      
      if (!isWater) {
        break; // Found a valid location
      }
      
      console.log('Privacy offset landed in water, retrying...');
      
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
    return [lng + (Math.random() - 0.5) * 0.001, lat + (Math.random() - 0.5) * 0.001];
  }
}
