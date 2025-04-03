
export const checkNetworkConnection = async (): Promise<boolean> => {
  // Quick check if browser reports as offline
  if (!navigator.onLine) {
    return false;
  }
  
  try {
    // Use a faster, lighter endpoint for connectivity check
    const controller = new AbortController();
    let timeoutId: number | undefined;
    
    try {
      timeoutId = window.setTimeout(() => controller.abort(), 3000);
      
      const startTime = Date.now();
      
      // Try a faster HEAD request to a lightweight endpoint
      const response = await fetch('https://www.gstatic.com/generate_204', { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal
      });
      
      if (timeoutId) window.clearTimeout(timeoutId);
      return true;
    } catch (e) {
      // Fall through to Supabase check
      if (timeoutId) window.clearTimeout(timeoutId);
    }
    
    // Use a simplified Supabase ping that's faster
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Just check if connection to Supabase is available - lightest possible query
    await supabase.rpc('get_server_time').maybeSingle();
    
    const endTime = Date.now();
    
    // If the request takes too long, consider it a network issue
    if (endTime - startTime > 4000) { // Reduced from 7000ms
      console.warn('Network connection is very slow');
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};
