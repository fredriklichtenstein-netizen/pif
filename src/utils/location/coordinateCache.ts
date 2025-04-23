
// Cache for privacy-adjusted coordinates
const coordinateCache = new Map<string, [number, number]>();

/**
 * Get cached coordinates if available
 * Uses precise rounding for consistent cache key generation
 */
export const getCachedCoordinates = (lng: number, lat: number): [number, number] | undefined => {
  // Create a consistent cache key by rounding coordinates
  const roundedLng = Math.round(lng * 1000000) / 1000000;
  const roundedLat = Math.round(lat * 1000000) / 1000000;
  const cacheKey = `${roundedLng},${roundedLat}`;
  
  const cached = coordinateCache.get(cacheKey);
  if (cached) {
    console.log(`Cache hit for coordinates ${cacheKey}`);
  }
  return cached;
};

/**
 * Store coordinates in the cache
 * Uses precise rounding for consistent cache key generation
 */
export const cacheCoordinates = (lng: number, lat: number, adjustedCoords: [number, number]): void => {
  // Create a consistent cache key by rounding coordinates
  const roundedLng = Math.round(lng * 1000000) / 1000000;
  const roundedLat = Math.round(lat * 1000000) / 1000000;
  const cacheKey = `${roundedLng},${roundedLat}`;
  
  coordinateCache.set(cacheKey, adjustedCoords);
  console.log('Cached new privacy coordinates for:', cacheKey, 
              'Original:', [roundedLng, roundedLat], 
              'Adjusted:', adjustedCoords);
};
