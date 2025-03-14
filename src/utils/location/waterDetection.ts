
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
      
      // Get available layers first
      const availableLayers = map.getStyle().layers.map(layer => layer.id);
      
      // Filter water-related layers that exist in the current style
      const waterLayers = [
        'water',
        'waterway'
      ].filter(id => availableLayers.includes(id));
      
      // Add any other water-related layers
      const additionalWaterLayers = availableLayers.filter(id => 
        id.includes('water') || 
        id.includes('ocean') || 
        id.includes('sea') || 
        id.includes('lake')
      );
      waterLayers.push(...additionalWaterLayers);
      
      // If no water layers found, return false as we can't check
      if (waterLayers.length === 0) {
        console.log("No water layers found in map style");
        return false;
      }

      // Query for water features at the exact point
      const features = map.queryRenderedFeatures(point, {
        layers: waterLayers
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
        console.log(`Water detected at [${lng}, ${lat}]`);
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
