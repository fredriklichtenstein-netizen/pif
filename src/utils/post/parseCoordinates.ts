
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
      // Ensure values are parsed as numbers
      const lat = Number(coordinates.lat);
      const lng = Number(coordinates.lng);
      
      // Validate numbers are valid
      if (!isNaN(lat) && !isNaN(lng)) {
        console.log("Valid lat/lng parsed:", { lat, lng });
        return { lat, lng };
      }
    }
    
    // Format 2: PostGIS point "(lng,lat)" string
    if (typeof coordinates === "string") {
      // Match both standard PostGIS format "(lng,lat)" and variations like "POINT(lng lat)"
      const simpleMatches = coordinates.match(/\(([-\d.]+),([-\d.]+)\)/);
      const pointMatches = coordinates.match(/POINT\(([-\d.]+) ([-\d.]+)\)/i);
      
      if (simpleMatches && simpleMatches.length >= 3) {
        console.log("Found Format 2a: PostGIS point string format (lng,lat)");
        const lng = parseFloat(simpleMatches[1]);
        const lat = parseFloat(simpleMatches[2]);
        
        if (!isNaN(lng) && !isNaN(lat)) {
          console.log("Valid lat/lng parsed:", { lat, lng });
          return { lat, lng };
        }
      }
      
      if (pointMatches && pointMatches.length >= 3) {
        console.log("Found Format 2b: PostGIS POINT(lng lat) format");
        const lng = parseFloat(pointMatches[1]);
        const lat = parseFloat(pointMatches[2]);
        
        if (!isNaN(lng) && !isNaN(lat)) {
          console.log("Valid lat/lng parsed:", { lat, lng });
          return { lat, lng };
        }
      }
    }
    
    // Format 3: PostGIS point object with x, y properties
    if (typeof coordinates === "object" && coordinates !== null && "x" in coordinates && "y" in coordinates) {
      console.log("Found Format 3: PostGIS point object with x/y");
      const lng = Number(coordinates.x);
      const lat = Number(coordinates.y);
      
      if (!isNaN(lng) && !isNaN(lat)) {
        console.log("Valid lat/lng parsed:", { lat, lng });
        return { lat, lng };
      }
    }
    
    // Format 4: Array [lng, lat]
    if (Array.isArray(coordinates) && coordinates.length >= 2) {
      console.log("Found Format 4: Array [lng, lat]");
      const lng = Number(coordinates[0]);
      const lat = Number(coordinates[1]);
      
      if (!isNaN(lng) && !isNaN(lat)) {
        console.log("Valid lat/lng parsed:", { lat, lng });
        return { lat, lng };
      }
    }
    
    // Format 5: PostGIS geometry object
    if (typeof coordinates === "object" && coordinates !== null && 
        coordinates.type === "Point" && Array.isArray(coordinates.coordinates) && 
        coordinates.coordinates.length >= 2) {
      console.log("Found Format 5: PostGIS geometry object");
      const lng = Number(coordinates.coordinates[0]);
      const lat = Number(coordinates.coordinates[1]);
      
      if (!isNaN(lng) && !isNaN(lat)) {
        console.log("Valid lat/lng parsed:", { lat, lng });
        return { lat, lng };
      }
    }
    
    console.log("No matching coordinate format found");
    return null;
  } catch (err) {
    console.error("Error parsing coordinates:", err, coordinates);
    return null;
  }
}
