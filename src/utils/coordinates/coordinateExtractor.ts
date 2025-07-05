/**
 * Robust coordinate extraction utility that handles various coordinate formats
 * including PostGIS Point objects, plain objects, and string representations
 */

export interface CoordinateResult {
  lat: number;
  lng: number;
}

/**
 * Extract coordinates from any format (PostGIS Point, Object, String, etc.)
 */
export function extractCoordinates(coordinates: any): CoordinateResult | null {
  if (!coordinates) return null;
  
  console.log("Extracting coordinates from:", coordinates, "Type:", typeof coordinates);
  
  try {
    // Method 1: Try direct property access (for plain objects)
    if (typeof coordinates === "object" && coordinates !== null) {
      const directLng = coordinates.lng || coordinates.x;
      const directLat = coordinates.lat || coordinates.y;
      
      if (typeof directLng === 'number' && typeof directLat === 'number' && 
          !isNaN(directLng) && !isNaN(directLat)) {
        console.log("Extracted via direct access:", { lng: directLng, lat: directLat });
        return { lng: directLng, lat: directLat };
      }
    }
    
    // Method 2: Try Object.getOwnPropertyDescriptors for special objects
    if (typeof coordinates === "object" && coordinates !== null) {
      const descriptors = Object.getOwnPropertyDescriptors(coordinates);
      const lngDesc = descriptors.lng || descriptors.x;
      const latDesc = descriptors.lat || descriptors.y;
      
      const descriptorLng = lngDesc?.value;
      const descriptorLat = latDesc?.value;
      
      if (typeof descriptorLng === 'number' && typeof descriptorLat === 'number' && 
          !isNaN(descriptorLng) && !isNaN(descriptorLat)) {
        console.log("Extracted via descriptors:", { lng: descriptorLng, lat: descriptorLat });
        return { lng: descriptorLng, lat: descriptorLat };
      }
    }
    
    // Method 3: Try Object.keys iteration for enumerable properties
    if (typeof coordinates === "object" && coordinates !== null) {
      const keys = Object.keys(coordinates);
      let foundLng: number | undefined;
      let foundLat: number | undefined;
      
      for (const key of keys) {
        const value = coordinates[key];
        if (typeof value === 'number' && !isNaN(value)) {
          if (key === 'lng' || key === 'x') foundLng = value;
          if (key === 'lat' || key === 'y') foundLat = value;
        }
      }
      
      if (typeof foundLng === 'number' && typeof foundLat === 'number') {
        console.log("Extracted via keys iteration:", { lng: foundLng, lat: foundLat });
        return { lng: foundLng, lat: foundLat };
      }
    }
    
    // Method 4: Try JSON parsing if it's an object that can be stringified
    if (typeof coordinates === "object" && coordinates !== null) {
      try {
        const jsonStr = JSON.stringify(coordinates);
        const parsed = JSON.parse(jsonStr);
        
        if (parsed && typeof parsed === 'object') {
          const jsonLng = parsed.lng || parsed.x;
          const jsonLat = parsed.lat || parsed.y;
          
          if (typeof jsonLng === 'number' && typeof jsonLat === 'number' && 
              !isNaN(jsonLng) && !isNaN(jsonLat)) {
            console.log("Extracted via JSON:", { lng: jsonLng, lat: jsonLat });
            return { lng: jsonLng, lat: jsonLat };
          }
        }
      } catch (e) {
        // JSON parsing failed, continue to next method
      }
    }
    
    // Method 5: Try string parsing for PostGIS formats
    const coordStr = String(coordinates);
    if (coordStr && coordStr !== '[object Object]') {
      const result = parseCoordinatesFromString(coordStr);
      if (result) {
        console.log("Extracted via string parsing:", result);
        return result;
      }
    }
    
    // Method 6: Try extracting from toString() output that might contain coordinate values
    try {
      const str = coordinates.toString();
      const numberMatches = str.match(/([-\d.]+)/g);
      if (numberMatches && numberMatches.length >= 2) {
        const nums = numberMatches.map(n => parseFloat(n)).filter(n => !isNaN(n));
        if (nums.length >= 2) {
          // Assume first is lng, second is lat (common PostGIS format)
          const [lng, lat] = nums;
          if (Math.abs(lng) <= 180 && Math.abs(lat) <= 90) {
            console.log("Extracted via toString parsing:", { lng, lat });
            return { lng, lat };
          }
        }
      }
    } catch (e) {
      // toString parsing failed
    }
    
    console.warn("Could not extract coordinates from:", coordinates);
    return null;
  } catch (error) {
    console.error("Error extracting coordinates:", error, coordinates);
    return null;
  }
}

/**
 * Parse coordinates from string format (PostGIS, etc.)
 */
function parseCoordinatesFromString(coordinates: string): CoordinateResult | null {
  if (!coordinates) return null;
  
  try {
    // Match both standard PostGIS format "(lng,lat)" and variations like "POINT(lng lat)"
    const simpleMatches = coordinates.match(/\(([-\d.]+),([-\d.]+)\)/);
    const pointMatches = coordinates.match(/POINT\(([-\d.]+) ([-\d.]+)\)/i);
    
    if (simpleMatches && simpleMatches.length >= 3) {
      return {
        lat: parseFloat(simpleMatches[2]),  // lat is the second value
        lng: parseFloat(simpleMatches[1]),  // lng is the first value
      };
    }
    
    if (pointMatches && pointMatches.length >= 3) {
      return {
        lng: parseFloat(pointMatches[1]),  // lng is the first value
        lat: parseFloat(pointMatches[2]),  // lat is the second value
      };
    }
    
    return null;
  } catch (err) {
    console.error("Error parsing coordinates from string:", err, coordinates);
    return null;
  }
}