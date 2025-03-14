
import { checkForWaterAt } from "./location/waterDetection";
import { getPrivacyOffset } from "./location/privacyOffset";
import { checkIfUrban } from "./location/urbanDetection";
import { getCachedCoordinates, setCachedCoordinates } from "./location/coordinateCache";
import mapboxgl from "mapbox-gl";

// Privacy radius for urban and rural areas in meters
const URBAN_PRIVACY_RADIUS = 100;
const RURAL_PRIVACY_RADIUS = 300;

/**
 * Adds privacy to coordinates by offsetting them a random distance
 * @param lng - Original longitude
 * @param lat - Original latitude
 * @param map - Optional mapbox map instance for water detection
 * @returns - Privacy-adjusted coordinates
 */
export const addLocationPrivacy = async (
  lng: number,
  lat: number,
  map?: mapboxgl.Map
): Promise<[number, number]> => {
  try {
    // Check if we have cached coordinates
    const cacheKey = `${lng.toFixed(6)},${lat.toFixed(6)}`;
    const cached = getCachedCoordinates(cacheKey);
    if (cached) {
      return cached;
    }

    // Check if the location is in an urban area
    const isUrban = await checkIfUrban(lng, lat);
    
    // Use appropriate privacy radius
    const privacyRadius = isUrban ? URBAN_PRIVACY_RADIUS : RURAL_PRIVACY_RADIUS;
    
    // Get privacy offset
    let offset = getPrivacyOffset(privacyRadius);
    let newLng = lng + offset.lngOffset;
    let newLat = lat + offset.latOffset;
    
    // Check for water if map is available
    let retries = 0;
    const MAX_RETRIES = 5;
    
    if (map) {
      const isMapStyleLoaded = map.isStyleLoaded();
      
      // Only attempt water detection if map style is loaded
      if (isMapStyleLoaded) {
        let isWater = await checkForWaterAt(newLng, newLat, map);
        
        // If location is in water, try again up to MAX_RETRIES times
        while (isWater && retries < MAX_RETRIES) {
          offset = getPrivacyOffset(privacyRadius);
          newLng = lng + offset.lngOffset;
          newLat = lat + offset.latOffset;
          isWater = await checkForWaterAt(newLng, newLat, map);
          retries++;
        }
      } else {
        console.log("Map style not loaded, skipping water detection");
      }
    }
    
    // Cache the result
    const result: [number, number] = [newLng, newLat];
    setCachedCoordinates(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error("Error adding location privacy:", error);
    // Return the original coordinates if there's an error
    return [lng, lat];
  }
};
