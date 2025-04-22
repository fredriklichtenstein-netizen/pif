
/**
 * Parse coordinates from an object or string.
 * @param coordinates {any} The coordinates value, as an object or string.
 * @returns { lat: number, lng: number } or null
 */
export function parseCoordinates(coordinates: any): { lat: number; lng: number } | null {
  if (!coordinates) return null;
  try {
    if (typeof coordinates === "object" && coordinates !== null && "lat" in coordinates && "lng" in coordinates) {
      return {
        lat: Number(coordinates.lat),
        lng: Number(coordinates.lng),
      };
    }
    if (typeof coordinates === "string") {
      const matches = coordinates.match(/\(([-\d.]+),([-\d.]+)\)/);
      if (matches && matches.length >= 3) {
        return {
          lng: parseFloat(matches[1]),
          lat: parseFloat(matches[2]),
        };
      }
    }
  } catch (err) {
    console.error("Error parsing coordinates:", err, coordinates);
  }
  return null;
}
