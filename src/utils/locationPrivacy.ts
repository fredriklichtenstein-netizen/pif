
import mapboxgl, { Point } from "mapbox-gl";

/**
 * Checks if coordinates are within an urban area based on Mapbox infrastructure data
 * Uses building density, road network, and land use classification
 * Falls back to predefined city boundaries if infrastructure data isn't available
 */
export const isUrbanArea = (lat: number, lng: number, _mapZoom?: number, map?: mapboxgl.Map): boolean => {
  // If map object is provided, use infrastructure data
  if (map && map.isStyleLoaded()) {
    try {
      // Convert lat/lng to pixel coordinates for querying features
      const point = map.project([lng, lat]);
      
      // Create two points for the bounding box
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

      // Count road segments
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

      // Urban if: many buildings OR (multiple roads AND not rural)
      const isUrban = (buildingCount > 5 || (roadCount >= 2 && !hasRuralLanduse));

      console.log(`Location analysis at [${lng}, ${lat}]:`, {
        buildingCount,
        roadCount,
        hasRuralLanduse,
        isUrban
      });

      return isUrban;
    } catch (error) {
      console.error("Error determining urban area:", error);
      // Fall back directly to city bounds, no zoom check
    }
  }
  
  // Fallback for when infrastructure data isn't available or fails
  // Use predefined city bounds as the only fallback
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
