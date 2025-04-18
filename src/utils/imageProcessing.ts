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

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

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

export const optimizeImageUrl = (url: string, width: number = 600): string => {
  // Return placeholder if URL is not valid
  if (!url || typeof url !== 'string') {
    return "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder";
  }
  
  try {
    // Handle different image sources differently
    if (url.includes('unsplash.com')) {
      // For Unsplash, use their image API
      const baseUrl = url.split('?')[0];
      return `${baseUrl}?w=${width}&q=80&auto=format`;
    } 
    else if (url.includes('supabase.co') || url.includes('.supabase.')) {
      // For Supabase Storage URLs
      if (url.includes('?')) {
        return `${url}&width=${width}&quality=70`;
      } else {
        return `${url}?width=${width}&quality=70`;
      }
    }
    else if (url.includes('dicebear.com')) {
      // DiceBear avatars already optimized
      return url;
    }
    
    // Default case - return original with cache timestamp to avoid stale cache
    return url.includes('?') 
      ? `${url}&_t=${Date.now()}` 
      : `${url}?_t=${Date.now()}`;
  } catch (error) {
    console.warn('Failed to optimize image URL:', error);
    return url;
  }
};

export const loadImageProgressively = (
  url: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    let loaded = false;
    
    image.onload = () => {
      if (onProgress) onProgress(100);
      loaded = true;
      resolve(url);
    };
    
    image.onerror = () => {
      reject(new Error(`Failed to load image: ${url}`));
    };
    
    // Set a timeout to detect slow loading
    setTimeout(() => {
      if (!loaded && onProgress) {
        onProgress(50); // Indicate partial progress
      }
    }, 200);
    
    // Try with a cache buster to avoid stale cache
    const cacheBuster = `${url}${url.includes('?') ? '&' : '?'}cache=${Date.now()}`;
    image.src = cacheBuster;
  });
};
