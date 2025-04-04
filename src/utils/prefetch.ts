
/**
 * Prefetch a page or resource
 */
export function prefetchRoute(path: string): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = path;
  link.as = path.endsWith('.js') ? 'script' : 'document';
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

/**
 * Prefetch an image
 */
export function prefetchImage(src: string): void {
  if (!src || typeof src !== 'string') return;
  
  const img = new Image();
  img.src = src;
}

/**
 * Prefetch commonly used routes based on current route
 */
export function prefetchRelatedRoutes(currentRoute: string): void {
  // Define related routes to prefetch based on current route
  const routeMap: Record<string, string[]> = {
    '/': ['/profile', '/map', '/auth'],
    '/profile': ['/account-settings', '/'],
    '/map': ['/', '/profile'],
    '/post': ['/', '/profile'],
    '/auth': ['/profile', '/']
  };
  
  // Get routes to prefetch
  const routesToPrefetch = routeMap[currentRoute] || [];
  
  // Prefetch related routes with a small delay to not block main thread
  if (routesToPrefetch.length > 0) {
    setTimeout(() => {
      routesToPrefetch.forEach(route => {
        prefetchRoute(route);
      });
    }, 1000);
  }
}
