
// Handles progressive image loading and validation
export const loadImageProgressively = (
  url: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve) => {
    if (!url || url.trim() === '') {
      if (onProgress) onProgress(100);
      resolve("https://placehold.co/600x400/e2e8f0/94a3b8?text=No+Image");
      return;
    }
    
    if (url.startsWith('data:') || 
        url.includes('placehold.co') || 
        url.includes('dicebear.com') ||
        url.includes('ui-avatars.com')) {
      if (onProgress) onProgress(100);
      resolve(url);
      return;
    }
    
    const image = new Image();
    let loaded = false;
    let retried = false;
    
    image.onload = () => {
      if (onProgress) onProgress(100);
      loaded = true;
      resolve(url);
    };
    
    image.onerror = () => {
      console.error(`Failed to load image: ${url}`);
      
      if (!retried) {
        retried = true;
        const cacheBuster = `${url}${url.includes('?') ? '&' : '?'}cb=${Date.now()}`;
        image.src = cacheBuster;
        return;
      }
      
      if (onProgress) onProgress(100);
      resolve("https://placehold.co/600x400/e2e8f0/94a3b8?text=No+Image");
    };
    
    setTimeout(() => {
      if (!loaded && onProgress) {
        onProgress(50);
      }
    }, 200);
    
    image.src = url;
  });
};

export const validateImageUrl = async (url: string): Promise<boolean> => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return false;
  }
  
  if (url.startsWith('data:') || url.includes('placehold.co') || url.includes('dicebear.com')) {
    return true;
  }
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};
