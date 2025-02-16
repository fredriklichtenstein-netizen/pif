
/**
 * Checks if coordinates are within the urban area (Stockholm bounds)
 */
export const isUrbanArea = (lat: number, lng: number): boolean => {
  return (
    lat >= 59.1 && lat <= 59.5 && // Stockholm latitude bounds
    lng >= 17.8 && lng <= 18.3    // Stockholm longitude bounds
  );
};

/**
 * Adds intentional variance to coordinates for privacy
 * Uses smaller radius in urban areas (+-200m) and larger in rural areas (+-5km)
 */
export const addLocationPrivacy = (lng: number, lat: number): [number, number] => {
  // Define radii in degrees (approximate conversion)
  const URBAN_RADIUS = 0.001; // ~100m
  const RURAL_RADIUS = 0.045; // ~5km
  
  const radius = isUrbanArea(lat, lng) ? URBAN_RADIUS : RURAL_RADIUS;
  
  // Generate a deterministic offset based on the coordinates
  // This ensures the same coordinates always get the same offset
  const seed = Math.sin(lat * lng) * 10000;
  const angle = seed * Math.PI * 2;
  const distance = Math.abs(Math.cos(seed)) * radius;
  
  const offsetLng = distance * Math.cos(angle);
  const offsetLat = distance * Math.sin(angle);
  
  return [
    lng + offsetLng,
    lat + offsetLat
  ];
};
