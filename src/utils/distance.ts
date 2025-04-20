
/**
 * Calculates the distance between two points using the Haversine formula
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  // Convert coordinates from degrees to radians
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);
  const radLat1 = toRadians(lat1);
  const radLon1 = toRadians(lon1);
  const radLat2 = toRadians(lat2);
  const radLon2 = toRadians(lon2);

  // Earth's radius in kilometers
  const R = 6371;
  
  // Haversine formula
  const dLat = radLat2 - radLat1;
  const dLon = radLon2 - radLon1;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  console.log("Distance calculation:", {lat1, lon1, lat2, lon2, distance});
  
  return distance;
};

/**
 * Formats a distance in kilometers to a human-readable string
 * with appropriate units and rounding based on distance
 */
export const formatDistance = (distanceKm: number): string => {
  if (isNaN(distanceKm)) {
    return "NaN km";
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
