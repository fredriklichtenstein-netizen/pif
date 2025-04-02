
export const checkNetworkConnection = async (): Promise<boolean> => {
  if (!navigator.onLine) {
    return false;
  }
  
  try {
    // Try to make a minimal request to check connectivity
    const startTime = Date.now();
    
    // First try to fetch from a reliable service
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://www.google.com/generate_204', { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        credentials: 'omit',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('Network ping time (external):', Date.now() - startTime, 'ms');
      return true;
    } catch (e) {
      console.log('External connectivity check failed, trying Supabase');
    }
    
    // Fallback to Supabase
    const { supabase } = await import('@/integrations/supabase/client');
    await supabase.auth.getSession();
    const endTime = Date.now();
    
    console.log(`Network ping time (Supabase): ${endTime - startTime}ms`);
    
    // If the request takes too long, consider it a network issue
    if (endTime - startTime > 7000) {
      console.warn('Network connection is very slow');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Network connection check failed:', error);
    return false;
  }
};
