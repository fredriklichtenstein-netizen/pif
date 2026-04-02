
// Cache for privacy-adjusted coordinates
const coordinateCache = new Map<string, [number, number]>();

/**
 * Get cached coordinates if available
 */
export const getCachedCoordinates = (lng: number, lat: number): [number, number] | undefined => {
  const cacheKey = `${lng},${lat}`;
  return coordinateCache.get(cacheKey);
};

/**
 * Store coordinates in the cache
 */
export const cacheCoordinates = (lng: number, lat: number, adjustedCoords: [number, number]): void => {
  const cacheKey = `${lng},${lat}`;
  coordinateCache.set(cacheKey, adjustedCoords);
};
