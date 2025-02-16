
/**
 * Uses Mapbox's landuse layer to determine if a location is urban
 * This provides more accurate and consistent classification
 */
export const isUrbanArea = async (map: mapboxgl.Map | null, lat: number, lng: number): Promise<boolean> => {
  if (!map) return false;

  // Query features at the given coordinates
  const point = map.project([lng, lat]);
  const features = map.queryRenderedFeatures(point, {
    layers: ['landuse', 'landuse-residential', 'building']
  });

  // Calculate urban density based on features
  const hasBuildings = features.some(f => f.sourceLayer === 'building');
  const hasResidential = features.some(f => 
    f.sourceLayer === 'landuse' && 
    (f.properties?.class === 'residential' || f.properties?.class === 'commercial')
  );
  
  // Consider area urban if it has both buildings and residential/commercial landuse
  return hasBuildings && hasResidential;
};

/**
 * Adds intentional variance to coordinates for privacy
 * Uses smaller radius in urban areas (+-200m) and larger in rural areas (+-5km)
 */
export const addLocationPrivacy = async (map: mapboxgl.Map | null, lng: number, lat: number): Promise<[number, number]> => {
  // Define radii in degrees (approximate conversion)
  const URBAN_RADIUS = 0.001; // ~100m
  const RURAL_RADIUS = 0.045; // ~5km
  
  const isUrban = await isUrbanArea(map, lat, lng);
  const radius = isUrban ? URBAN_RADIUS : RURAL_RADIUS;
  
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
