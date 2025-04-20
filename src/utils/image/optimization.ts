
// Handles image URL optimization and caching
const imageCache = new Map<string, string>();

export const optimizeImageUrl = (url: string, width: number = 600): string => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return "https://placehold.co/600x400/e2e8f0/94a3b8?text=No+Image";
  }
  
  const cacheKey = `${url}_${width}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }
  
  if (url.startsWith('data:') || url.includes('placehold.co') || url.includes('dicebear.com')) {
    return url;
  }
  
  try {
    let finalUrl = url;
    if (url.startsWith('./')) {
      finalUrl = url.substring(1);
    }
    
    imageCache.set(cacheKey, finalUrl);
    return finalUrl;
  } catch (error) {
    console.error('Error optimizing image URL:', error);
    return "https://placehold.co/600x400/e2e8f0/94a3b8?text=Error";
  }
};
