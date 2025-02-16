
/**
 * Checks if coordinates are within an urban area based on map zoom level
 * Uses zoom level as a proxy for population density/urban development
 * Zoom 10+ typically represents city/town level detail
 */
export const isUrbanArea = (lat: number, lng: number, mapZoom?: number): boolean => {
  if (mapZoom !== undefined) {
    return mapZoom >= 10;
  }
  
  // Fallback for when zoom level isn't available (e.g., during privacy calculations)
  // Use a more granular approach based on known major urban coordinates
  // These bounds are approximate and should be expanded based on usage data
  const MAJOR_URBAN_AREAS = [
    // Stockholm
    { minLat: 59.1, maxLat: 59.5, minLng: 17.8, maxLng: 18.3 },
    // Gothenburg
    { minLat: 57.6, maxLat: 57.8, minLng: 11.8, maxLng: 12.1 },
    // Malmö
    { minLat: 55.5, maxLat: 55.7, minLng: 12.9, maxLng: 13.1 }
  ];

  return MAJOR_URBAN_AREAS.some(area => 
    lat >= area.minLat && lat <= area.maxLat &&
    lng >= area.minLng && lng <= area.maxLng
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
