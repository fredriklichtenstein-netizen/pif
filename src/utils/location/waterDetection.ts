
import mapboxgl from "mapbox-gl";

/**
 * Checks if coordinates are on water (sea, lake, river, etc.)
 */
export const isWaterLocation = async (lng: number, lat: number, map?: mapboxgl.Map): Promise<boolean> => {
  // If map object is provided, use it to check water features
  if (map && map.isStyleLoaded()) {
    try {
      // Convert lat/lng to pixel coordinates for querying features
      const point = map.project([lng, lat]);
      
      // Get all available style layers
      const availableLayers = map.getStyle().layers?.map(layer => layer.id) || [];
      
      // Define water-related layers we want to check
      const waterLayers = [
        'water',
        'waterway',
        'water-area',
        'water-name',
        'water-point'
      ];
      
      // Filter to only use layers that actually exist in current style
      const existingWaterLayers = waterLayers.filter(layer => 
        availableLayers.includes(layer)
      );
      
      // If no valid water layers exist, we can't check
      if (existingWaterLayers.length === 0) {
        return false;
      }
      
      // Query for water features at the exact point using only existing layers
      const features = map.queryRenderedFeatures(point, {
        layers: existingWaterLayers
      });

      // If any water features are found, consider it a water location
      const isWater = features.some(f => 
        f.sourceLayer === 'water' || 
        f.layer.id.includes('water') ||
        (f.properties && 
          (f.properties.class === 'water' || 
           f.properties.type === 'water' ||
           f.properties.natural === 'water' ||
           f.properties.natural === 'sea' ||
           f.properties.natural === 'lake')
        )
      );

      if (isWater) {
      }
      
      return isWater;
    } catch (error) {
      console.error("Error determining water location:", error);
      return false;
    }
  }
  
  // No map available, return false to be safe
  return false;
};
