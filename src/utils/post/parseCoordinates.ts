
/**
 * Parse coordinates from an object or string.
 * @param coordinates {any} The coordinates value, as an object or string.
 * @returns { lat: number, lng: number } or null
 */
export function parseCoordinates(coordinates: any): { lat: number; lng: number } | null {
  if (!coordinates) return null;
  
  console.log("Parsing coordinates:", coordinates, typeof coordinates);
  
  try {
    // Format 1: { lat: number, lng: number }
    if (typeof coordinates === "object" && coordinates !== null && "lat" in coordinates && "lng" in coordinates) {
      console.log("Found Format 1: Object with lat/lng properties");
      return {
        lat: Number(coordinates.lat),
        lng: Number(coordinates.lng),
      };
    }
    
    // Format 2: PostGIS point "(lng,lat)" string
    if (typeof coordinates === "string") {
      // Match both standard PostGIS format "(lng,lat)" and variations like "POINT(lng lat)"
      const simpleMatches = coordinates.match(/\(([-\d.]+),([-\d.]+)\)/);
      const pointMatches = coordinates.match(/POINT\(([-\d.]+) ([-\d.]+)\)/i);
      
      if (simpleMatches && simpleMatches.length >= 3) {
        console.log("Found Format 2a: PostGIS point string format (lng,lat)");
        return {
          lat: parseFloat(simpleMatches[2]),  // lat is the second value
          lng: parseFloat(simpleMatches[1]),  // lng is the first value
        };
      }
      
      if (pointMatches && pointMatches.length >= 3) {
        console.log("Found Format 2b: PostGIS POINT(lng lat) format");
        return {
          lng: parseFloat(pointMatches[1]),  // lng is the first value
          lat: parseFloat(pointMatches[2]),  // lat is the second value
        };
      }
    }

    // Format 2c: Simple "lng,lat" string
      const simpleCommaMatch = coordinates.match(/^([-\d.]+),([-\d.]+)$/);
      if (simpleCommaMatch && simpleCommaMatch.length >= 3) {
        console.log("Found Format 2c: Simple lng,lat string");
        return {
          lng: parseFloat(simpleCommaMatch[1]),
          lat: parseFloat(simpleCommaMatch[2]),
        };
      }
    
    // Format 3: PostGIS point object with x, y properties
    if (typeof coordinates === "object" && coordinates !== null && "x" in coordinates && "y" in coordinates) {
      console.log("Found Format 3: PostGIS point object with x/y");
      return {
        lng: Number(coordinates.x),
        lat: Number(coordinates.y),
      };
    }
    
    // Format 4: Array [lng, lat]
    if (Array.isArray(coordinates) && coordinates.length >= 2) {
      console.log("Found Format 4: Array [lng, lat]");
      return {
        lng: Number(coordinates[0]),
        lat: Number(coordinates[1]),
      };
    }
    
    // Format 5: PostGIS geometry object
    if (typeof coordinates === "object" && coordinates !== null && coordinates.type === "Point" && 
        Array.isArray(coordinates.coordinates) && coordinates.coordinates.length >= 2) {
      console.log("Found Format 5: PostGIS geometry object");
      return {
        lng: Number(coordinates.coordinates[0]),
        lat: Number(coordinates.coordinates[1]),
      };
    }
    
    console.log("No matching coordinate format found");
    return null;
  } catch (err) {
    console.error("Error parsing coordinates:", err, coordinates);
    return null;
  }
}
