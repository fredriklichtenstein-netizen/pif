
import mapboxgl, { Point } from "mapbox-gl";
import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if coordinates are within an urban area based on Mapbox infrastructure data
 * Uses building density, road network, and land use classification
 * Falls back to database of Swedish urban areas if infrastructure data isn't available
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
      
      // If no valid infrastructure layers exist, fall back to database check
      if (existingLayers.length === 0) {
        console.log("No infrastructure layers available in current map style, falling back to database");
        return fallbackToDatabaseCheck(lat, lng);
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

      console.log(`Location analysis at [${lng}, ${lat}]:`, {
        buildingCount,
        roadCount,
        hasRuralLanduse,
        isUrban
      });

      return isUrban;
    } catch (error) {
      console.error("Error determining urban area:", error);
      // Fall back to database check
      return fallbackToDatabaseCheck(lat, lng);
    }
  }
  
  // Fallback to database check
  return fallbackToDatabaseCheck(lat, lng);
};

/**
 * Fallback method to check against database of Swedish urban areas
 */
async function fallbackToDatabaseCheck(lat: number, lng: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('swedish_urban_areas')
      .select('id')
      .gte('min_lat', lat)
      .lte('max_lat', lat)
      .gte('min_lng', lng)
      .lte('max_lng', lng)
      .limit(1);

    if (error) {
      console.error("Error checking urban areas database:", error);
      return false;
    }

    return data.length > 0;
  } catch (error) {
    console.error("Error in database fallback for urban detection:", error);
    return false;
  }
}
