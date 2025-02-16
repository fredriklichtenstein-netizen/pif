
/**
 * Calculates the distance between two points using the Haversine formula
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Formats a distance in kilometers to a human-readable string
 * with appropriate units and rounding based on distance
 */
export const formatDistance = (distanceKm: number): string => {
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
