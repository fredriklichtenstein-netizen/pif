
import mapboxgl, { Point } from "mapbox-gl";

/**
 * Checks if coordinates are within an urban area based on Mapbox infrastructure data
 * Uses building density, road network, and land use classification.
 * If no map instance is provided or infrastructure data isn't available, returns false
 * (treats as rural, which applies the larger, more privacy-preserving offset).
 */
export const isUrbanArea = async (lat: number, lng: number, _mapZoom?: number, map?: mapboxgl.Map): Promise<boolean> => {
  // If map object is provided, use infrastructure data
  if (map && map.isStyleLoaded()) {
    try {
      // Get all available style layers
      const availableLayers = map.getStyle().layers?.map(layer => layer.id) || [];
      
      // Define infrastructure layers we want to check
      const infrastructureLayers = [
        'building',          // Building footprints
        'road',             // Road networks
        'landuse'           // Land use classifications
      ];
      
      // Filter to only use layers that actually exist in current style
      const existingLayers = infrastructureLayers.filter(layer => 
        availableLayers.includes(layer)
      );
      
      // If no valid infrastructure layers exist, treat as rural (safer privacy default)
      if (existingLayers.length === 0) {
        return false;
      }
      
      // Convert lat/lng to pixel coordinates for querying features
      const point = map.project([lng, lat]);
      
      // Create two points for the bounding box
      const sw: Point = new Point(point.x - 100, point.y + 100);
      const ne: Point = new Point(point.x + 100, point.y - 100);

      // Get all relevant features within the bounding box
      const features = map.queryRenderedFeatures([sw, ne], {
        layers: existingLayers
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
      return isUrban;
    } catch (error) {
      console.error("Error determining urban area:", error);
      return false;
    }
  }
  
  // No map available — default to rural for stronger privacy offset
  return false;
};
