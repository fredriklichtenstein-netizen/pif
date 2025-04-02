
export const checkNetworkConnection = async (): Promise<boolean> => {
  if (!navigator.onLine) {
    return false;
  }
  
  try {
    // Try to make a minimal request to check connectivity
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
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
      // Continue with Supabase check
    }
    
    // Fallback to Supabase ping
    const startTime = Date.now();
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Just ping the service with a simple health check instead of auth
    const { error } = await supabase.from('profiles').select('id').limit(1);
    
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
