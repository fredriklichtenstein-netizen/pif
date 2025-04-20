
export const checkNetworkConnection = async (): Promise<boolean> => {
  // Quick check if browser reports as offline
  if (!navigator.onLine) {
    return false;
  }
  
  try {
    // Use a multi-stage approach to check connectivity
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 3000);
    
    try {
      // 1. Try a faster HEAD request to a reliable endpoint first
      const response = await fetch('https://www.gstatic.com/generate_204', { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal
      });
      
      window.clearTimeout(timeoutId);
      return true;
    } catch (e) {
      // If the first check fails, clear timeout and continue to Supabase check
      window.clearTimeout(timeoutId);
    }
    
    // 2. Try Supabase connectivity as backup
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Use a new controller for the second request
    const supabaseController = new AbortController();
    const supabaseTimeoutId = window.setTimeout(() => supabaseController.abort(), 4000);
    
    try {
      // Simple, lightweight query to check Supabase connection
      // Fix: Use signal property directly with controller instead of abortSignal method
      await supabase.from('profiles')
        .select('id')
        .limit(1)
        .maybeSingle()
        .then(result => {
          window.clearTimeout(supabaseTimeoutId);
          return result;
        });
      
      return true;
    } catch (error) {
      window.clearTimeout(supabaseTimeoutId);
      console.warn('Supabase connectivity check failed:', error);
      return false;
    }
  } catch (error) {
    console.error('Network connectivity check failed:', error);
    return false;
  }
};

// Network status monitoring function for components that need it
export const setupNetworkMonitoring = (
  onStatusChange: (online: boolean) => void,
  intervalMs = 15000
): () => void => {
  let lastStatus: boolean | null = null;
  
  const checkStatus = async () => {
    try {
      const isOnline = await checkNetworkConnection();
      
      // Only notify if status has changed
      if (lastStatus === null || lastStatus !== isOnline) {
        lastStatus = isOnline;
        onStatusChange(isOnline);
      }
    } catch (e) {
      console.error('Error in network monitoring:', e);
    }
  };
  
  // Initial check
  checkStatus();
  
  // Setup interval
  const intervalId = window.setInterval(checkStatus, intervalMs);
  
  // Setup browser online/offline events as backup
  const handleOnline = () => {
    console.log('Browser reports online');
    lastStatus = true;
    onStatusChange(true);
  };
  
  const handleOffline = () => {
    console.log('Browser reports offline');
    lastStatus = false;
    onStatusChange(false);
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Return cleanup function
  return () => {
    window.clearInterval(intervalId);
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};
