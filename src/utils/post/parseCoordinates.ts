
/**
 * Parse coordinates from an object or string.
 * @param coordinates {any} The coordinates value, as an object or string.
 * @returns { lat: number, lng: number } or null
 */
export function parseCoordinates(coordinates: any): { lat: number; lng: number } | null {
  if (!coordinates) return null;
  
  console.log("Parsing coordinates input:", coordinates, typeof coordinates);
  
  try {
    // Format 1: { lat: number, lng: number }
    if (typeof coordinates === "object" && coordinates !== null && "lat" in coordinates && "lng" in coordinates) {
      console.log("Found Format 1: Object with lat/lng properties");
      const lat = Number(coordinates.lat);
      const lng = Number(coordinates.lng);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    
    // Format 2: PostGIS point "(lng,lat)" string
    if (typeof coordinates === "string") {
      // Try to match the PostGIS point string format - corrected to swap order properly
      const matches = coordinates.match(/\(([-\d.]+),([-\d.]+)\)/);
      if (matches && matches.length >= 3) {
        console.log("Found Format 2: PostGIS point string format");
        const lng = parseFloat(matches[1]);
        const lat = parseFloat(matches[2]);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
      
      // Try to parse from JSON string that might be stored in the database
      try {
        const parsedJson = JSON.parse(coordinates);
        if (parsedJson && typeof parsedJson === "object") {
          if ("lat" in parsedJson && "lng" in parsedJson) {
            const lat = Number(parsedJson.lat);
            const lng = Number(parsedJson.lng);
            
            if (!isNaN(lat) && !isNaN(lng)) {
              console.log("Found Format: JSON string with lat/lng", { lat, lng });
              return { lat, lng };
            }
          } else if (Array.isArray(parsedJson) && parsedJson.length >= 2) {
            const lng = Number(parsedJson[0]);
            const lat = Number(parsedJson[1]);
            
            if (!isNaN(lat) && !isNaN(lng)) {
              console.log("Found Format: JSON array [lng, lat]", { lat, lng });
              return { lat, lng };
            }
          }
        }
      } catch (e) {
        // Not a valid JSON string, continue to other formats
      }
    }
    
    // Format 3: PostGIS point object with x, y properties
    if (typeof coordinates === "object" && coordinates !== null && "x" in coordinates && "y" in coordinates) {
      console.log("Found Format 3: PostGIS point object with x/y");
      const lng = Number(coordinates.x);
      const lat = Number(coordinates.y);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    
    // Format 4: Array [lng, lat]
    if (Array.isArray(coordinates) && coordinates.length >= 2) {
      console.log("Found Format 4: Array [lng, lat]");
      const lng = Number(coordinates[0]);
      const lat = Number(coordinates[1]);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    
    // Format 5: PostGIS geometry object
    if (typeof coordinates === "object" && coordinates !== null && coordinates.type === "Point" && 
        Array.isArray(coordinates.coordinates) && coordinates.coordinates.length >= 2) {
      console.log("Found Format 5: PostGIS geometry object");
      const lng = Number(coordinates.coordinates[0]);
      const lat = Number(coordinates.coordinates[1]);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    
    console.log("No matching coordinate format found or invalid coordinates");
    return null;
  } catch (err) {
    console.error("Error parsing coordinates:", err, coordinates);
    return null;
  }
}
