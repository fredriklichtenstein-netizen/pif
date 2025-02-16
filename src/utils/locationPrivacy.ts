
import mapboxgl, { Point } from "mapbox-gl";

/**
 * Checks if coordinates are within an urban area based on Mapbox infrastructure data
 * Uses building density, road network, and land use classification
 */
export const isUrbanArea = (map: mapboxgl.Map, lat: number, lng: number): boolean => {
  if (!map || !map.isStyleLoaded()) return false;

  try {
    // Convert lat/lng to pixel coordinates for querying features
    const point = map.project([lng, lat]);
    
    // Create two points for the bounding box that Mapbox expects
    const sw: Point = new Point(point.x - 100, point.y + 100);
    const ne: Point = new Point(point.x + 100, point.y - 100);

    // Get all relevant features within the bounding box
    const features = map.queryRenderedFeatures([sw, ne], {
      layers: [
        'building',          // Building footprints
        'road',             // Road networks
        'landuse'           // Land use classifications
      ]
    });

    // Count buildings
    const buildingCount = features.filter(f => 
      f.sourceLayer === 'building' || 
      f.layer.type === 'fill' && f.layer.id.includes('building')
    ).length;

    // Count road segments (as proxy for network density)
    const roadCount = features.filter(f => 
      f.sourceLayer === 'road' || 
      f.layer.type === 'line' && f.layer.id.includes('road')
    ).length;

    // Check landuse types
    const ruralLandUseTypes = ['agriculture', 'forest', 'grass', 'meadow', 'farmland'];
    const hasRuralLanduse = features.some(f => 
      f.sourceLayer === 'landuse' && 
      ruralLandUseTypes.includes(f.properties?.class as string)
    );

    // Define urban criteria:
    // - More than 5 buildings within radius OR
    // - At least 2 road segments AND
    // - Not explicitly rural landuse
    const isUrban = (buildingCount > 5 || roadCount >= 2) && !hasRuralLanduse;

    console.log(`Location analysis at [${lng}, ${lat}]:`, {
      buildingCount,
      roadCount,
      hasRuralLanduse,
      isUrban
    });

    return isUrban;
  } catch (error) {
    console.error("Error determining urban area:", error);
    return false; // Default to false on error
  }
};

/**
 * Adds intentional variance to coordinates for privacy
 * Uses smaller radius in urban areas (+-200m) and larger in rural areas (+-5km)
 */
export const addLocationPrivacy = (lng: number, lat: number): [number, number] => {
  // Define radii in degrees (approximate conversion)
  const URBAN_RADIUS = 0.001; // ~100m
  const RURAL_RADIUS = 0.045; // ~5km
  
  // If we can't determine urban/rural status, default to urban for safety
  const radius = RURAL_RADIUS;
  
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
