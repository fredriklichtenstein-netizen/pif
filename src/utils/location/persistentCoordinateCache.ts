
// Keys for localStorage
const COORDINATES_CACHE_KEY = 'pif_location_privacy_coordinates';
const CACHE_LAST_UPDATED_KEY = 'pif_location_privacy_updated';
const CACHE_EXPIRY_DAYS = 7;

// Cache for privacy-adjusted coordinates
type CoordinateCache = Record<string, [number, number]>;

// Initialize cache from localStorage
let coordinateCache: CoordinateCache = {};

// Load the cache from localStorage when module is imported
const loadCacheFromStorage = (): void => {
  try {
    if (typeof localStorage === 'undefined') return;
    
    const savedCache = localStorage.getItem(COORDINATES_CACHE_KEY);
    const lastUpdated = localStorage.getItem(CACHE_LAST_UPDATED_KEY);
    
    if (savedCache && lastUpdated) {
      // Check if cache is expired
      const updatedTimestamp = parseInt(lastUpdated, 10);
      const now = Date.now();
      const ageInDays = (now - updatedTimestamp) / (1000 * 60 * 60 * 24);
      
      if (ageInDays <= CACHE_EXPIRY_DAYS) {
        coordinateCache = JSON.parse(savedCache);
        console.log(`Loaded ${Object.keys(coordinateCache).length} privacy coordinates from cache`);
      } else {
        console.log('Privacy coordinate cache expired, creating new cache');
        resetCache();
      }
    }
  } catch (error) {
    console.error('Error loading coordinate cache from storage:', error);
    resetCache();
  }
};

// Save cache to localStorage
const saveCacheToStorage = (): void => {
  try {
    if (typeof localStorage === 'undefined') return;
    
    localStorage.setItem(COORDINATES_CACHE_KEY, JSON.stringify(coordinateCache));
    localStorage.setItem(CACHE_LAST_UPDATED_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error saving coordinate cache to storage:', error);
  }
};

// Reset the cache
const resetCache = (): void => {
  coordinateCache = {};
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(COORDINATES_CACHE_KEY);
    localStorage.removeItem(CACHE_LAST_UPDATED_KEY);
  }
};

// Generate a consistent cache key for coordinates
const getCacheKey = (lng: number, lat: number): string => {
  // Round to 6 decimal places for consistent keys
  const roundedLng = Math.round(lng * 1000000) / 1000000;
  const roundedLat = Math.round(lat * 1000000) / 1000000;
  return `${roundedLng},${roundedLat}`;
};

/**
 * Get cached coordinates if available
 */
export const getCachedCoordinates = (lng: number, lat: number): [number, number] | undefined => {
  const cacheKey = getCacheKey(lng, lat);
  return coordinateCache[cacheKey];
};

/**
 * Store coordinates in the cache
 */
export const cacheCoordinates = (lng: number, lat: number, adjustedCoords: [number, number]): void => {
  const cacheKey = getCacheKey(lng, lat);
  coordinateCache[cacheKey] = adjustedCoords;
  
  // Don't save on every update to reduce writes, use debounced save
  debouncedSave();
  
  console.log('Cached privacy coordinates for:', [lng, lat], 'Adjusted:', adjustedCoords);
};

/**
 * Get cache stats
 */
export const getCoordinateCacheStats = () => {
  return {
    size: Object.keys(coordinateCache).length,
    lastUpdated: localStorage.getItem(CACHE_LAST_UPDATED_KEY) || 'never'
  };
};

// Create a debounced save function to avoid excessive localStorage writes
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
const debouncedSave = () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveCacheToStorage();
    saveTimeout = null;
  }, 5000); // Save after 5 seconds of inactivity
};

// Initialize by loading cache from storage
loadCacheFromStorage();

// Save cache when browser/tab closes
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveCacheToStorage();
    }
  });
}

export { resetCache };
