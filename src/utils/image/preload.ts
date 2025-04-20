
// Handles image preloading functionality
import { optimizeImageUrl } from './optimization';

export const preloadImages = (urls: string[]): void => {
  if (!urls || !urls.length) return;
  
  urls.filter(url => url && typeof url === 'string' && url.trim() !== '')
    .forEach(url => {
      const img = new Image();
      img.src = optimizeImageUrl(url);
    });
};
