
/**
 * Simple coordinate parser for PostGIS point format: (lng,lat)
 */
export interface Coordinates {
  lng: number;
  lat: number;
}

export function parseCoordinates(coordinateData: any): Coordinates | null {
  if (!coordinateData) {
    return null;
  }
  try {
    // Convert to string to handle the (lng,lat) format
    const coordStr = String(coordinateData);
    
    // Match the PostGIS point format: (lng,lat)
    const match = coordStr.match(/\(([-\d.]+),([-\d.]+)\)/);
    
    if (match && match.length >= 3) {
      const lng = parseFloat(match[1]);
      const lat = parseFloat(match[2]);
      
      if (!isNaN(lng) && !isNaN(lat)) {
        return { lng, lat };
      }
    }
    
    console.warn("Could not parse coordinate format:", coordStr);
    return null;
  } catch (error) {
    console.error("Error parsing coordinates:", error);
    return null;
  }
}
