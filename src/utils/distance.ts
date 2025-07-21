
/**
 * Calculates the distance between two points using the Haversine formula
 * Coordinates should be in [lng, lat] format for consistency with Mapbox
 */
export const calculateDistance = (
  lng1: number,
  lat1: number,
  lng2: number,
  lat2: number
): number => {
  // Validate input coordinates
  if (typeof lng1 !== 'number' || typeof lat1 !== 'number' || 
      typeof lng2 !== 'number' || typeof lat2 !== 'number') {
    console.error('Invalid coordinate types for distance calculation:', { lng1, lat1, lng2, lat2 });
    return NaN;
  }

  if (isNaN(lng1) || isNaN(lat1) || isNaN(lng2) || isNaN(lat2)) {
    console.error('NaN coordinates for distance calculation:', { lng1, lat1, lng2, lat2 });
    return NaN;
  }

  // Validate coordinate ranges
  if (lng1 < -180 || lng1 > 180 || lng2 < -180 || lng2 > 180 ||
      lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
    console.error('Coordinates out of valid range:', { lng1, lat1, lng2, lat2 });
    return NaN;
  }

  // Convert coordinates from degrees to radians
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);
  const radLat1 = toRadians(lat1);
  const radLng1 = toRadians(lng1);
  const radLat2 = toRadians(lat2);
  const radLng2 = toRadians(lng2);

  // Earth's radius in kilometers
  const R = 6371;
  
  // Haversine formula
  const dLat = radLat2 - radLat1;
  const dLng = radLng2 - radLng1;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  console.log("Distance calculation - From:", { lng: lng1, lat: lat1 }, "To:", { lng: lng2, lat: lat2 }, "Distance:", distance, "km");
  
  return distance;
};

/**
 * Helper function to calculate distance from stored user location
 */
export const calculateDistanceFromUser = (
  targetLng: number,
  targetLat: number
): number => {
  try {
    const stored = localStorage.getItem('pif_user_location');
    if (!stored) {
      console.log('No stored user location for distance calculation');
      return NaN;
    }
    
    const userLocation = JSON.parse(stored);
    if (!Array.isArray(userLocation) || userLocation.length !== 2) {
      console.error('Invalid stored user location format:', userLocation);
      return NaN;
    }
    
    const [userLng, userLat] = userLocation;
    return calculateDistance(userLng, userLat, targetLng, targetLat);
  } catch (error) {
    console.error('Error calculating distance from user:', error);
    return NaN;
  }
};

/**
 * Formats a distance in kilometers to a human-readable string
 * with appropriate units and rounding based on distance
 */
export const formatDistance = (distanceKm: number): string => {
  if (isNaN(distanceKm) || distanceKm < 0) {
    return "";
  }
  
  if (distanceKm < 0.5) {
    return "<500 m";
  }
  if (distanceKm < 1) {
    // Round to nearest 100m for distances under 1km
    const meters = Math.round(distanceKm * 1000 / 100) * 100;
    return `${meters} m`;
  }
  if (distanceKm < 10) {
    // Round to 1 decimal for distances under 10km
    return `${distanceKm.toFixed(1)} km`;
  }
  // Round to whole number for distances over 10km
  return `${Math.round(distanceKm)} km`;
};
