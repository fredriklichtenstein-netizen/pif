/**
 * Adds intentional variance to coordinates for privacy
 * Uses smaller radius in urban areas (+-200m) and larger in rural areas (+-5km)
 */
export const addLocationPrivacy = (lng: number, lat: number): [number, number] => {
  // Define radii in degrees (approximate conversion)
  const URBAN_RADIUS = 0.002; // ~200m
  const RURAL_RADIUS = 0.045; // ~5km
  
  // Simple urban detection based on Stockholm city coordinates
  const isUrban = Math.abs(lat - 59.3293) < 0.1 && Math.abs(lng - 18.0686) < 0.1;
  const radius = isUrban ? URBAN_RADIUS : RURAL_RADIUS;
  
  // Add random offset within radius
  const randomAngle = Math.random() * 2 * Math.PI;
  const randomDistance = Math.random() * radius;
  
  const offsetLng = randomDistance * Math.cos(randomAngle);
  const offsetLat = randomDistance * Math.sin(randomAngle);
  
  return [
    lng + offsetLng,
    lat + offsetLat
  ];
};