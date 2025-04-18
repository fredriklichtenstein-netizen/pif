
export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const timeoutId = setTimeout(() => {
      reject(new Error("Image loading timeout"));
    }, 10000); // 10 second timeout
    
    image.addEventListener('load', () => {
      clearTimeout(timeoutId);
      resolve(image);
    });
    
    image.addEventListener('error', error => {
      clearTimeout(timeoutId);
      reject(error);
    });
    
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { width: number; height: number; x: number; y: number },
  shape: 'round' | 'rect' = 'rect'
): Promise<File | null> {
  try {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Set canvas dimensions
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Create a circular clip if shape is 'round'
    if (shape === 'round') {
      ctx.beginPath();
      ctx.arc(
        canvas.width / 2,
        canvas.height / 2,
        Math.min(canvas.width, canvas.height) / 2,
        0,
        2 * Math.PI,
        true
      );
      ctx.clip();
    }

    // Draw the image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // Convert canvas to blob/file
    return new Promise((resolve) => {
      try {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(null);
              return;
            }
            const file = new File([blob], 'cropped-image.jpg', {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(file);
          },
          'image/jpeg',
          0.85 // Reduced quality for better performance
        );
      } catch (err) {
        console.error('Canvas toBlob error:', err);
        resolve(null);
      }
    });
  } catch (err) {
    console.error('Image processing error:', err);
    return null;
  }
}

// Enhanced image URL optimization with better error handling and caching
const imageCache = new Map<string, string>();

export const optimizeImageUrl = (url: string, width: number = 600): string => {
  // Return placeholder for empty or invalid URLs
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return "https://placehold.co/600x400/e2e8f0/94a3b8?text=No+Image";
  }
  
  // Check cache first
  const cacheKey = `${url}_${width}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }
  
  // Directly return data URLs or placeholder images
  if (url.startsWith('data:') || url.includes('placehold.co') || url.includes('dicebear.com')) {
    return url;
  }
  
  try {
    // Handle relative URLs
    let finalUrl = url;
    if (url.startsWith('./')) {
      finalUrl = url.substring(1);
    }
    
    // Prepare the URL for caching
    imageCache.set(cacheKey, finalUrl);
    return finalUrl;
  } catch (error) {
    console.error('Error optimizing image URL:', error);
    return "https://placehold.co/600x400/e2e8f0/94a3b8?text=Error";
  }
};

// Load and track image loading progress with improved error handling
export const loadImageProgressively = (
  url: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve) => {
    // Handle empty URLs
    if (!url || url.trim() === '') {
      if (onProgress) onProgress(100);
      resolve("https://placehold.co/600x400/e2e8f0/94a3b8?text=No+Image");
      return;
    }
    
    // For data URLs or already cached images, resolve immediately
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
    
    // Success handler
    image.onload = () => {
      if (onProgress) onProgress(100);
      loaded = true;
      resolve(url);
    };
    
    // Error handler with retry
    image.onerror = () => {
      console.error(`Failed to load image: ${url}`);
      
      // Try once with a cache-busting parameter
      if (!retried) {
        retried = true;
        const cacheBuster = `${url}${url.includes('?') ? '&' : '?'}cb=${Date.now()}`;
        image.src = cacheBuster;
        return;
      }
      
      if (onProgress) onProgress(100);
      resolve("https://placehold.co/600x400/e2e8f0/94a3b8?text=No+Image");
    };
    
    // Set a timeout to detect slow loading
    setTimeout(() => {
      if (!loaded && onProgress) {
        onProgress(50); // Indicate partial progress
      }
    }, 200);
    
    // Start loading the image
    image.src = url;
  });
};

// New function: preload multiple images in the background
export const preloadImages = (urls: string[]): void => {
  if (!urls || !urls.length) return;
  
  urls.filter(url => url && typeof url === 'string' && url.trim() !== '')
    .forEach(url => {
      const img = new Image();
      img.src = optimizeImageUrl(url);
    });
};

// New function: check if an image exists and is valid
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
