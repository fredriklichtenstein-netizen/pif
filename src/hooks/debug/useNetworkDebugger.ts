
import { useState, useEffect, useCallback, useRef } from 'react';
import { checkNetworkConnection } from "@/hooks/auth/networkUtils";

export interface EndpointStatus {
  name: string;
  url: string;
  status: 'pending' | 'success' | 'error';
  latency: number | null;
}

export function useNetworkDebugger() {
  const [isInDevMode] = useState(process.env.NODE_ENV === 'development');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([
    { name: 'Google', url: 'https://www.google.com', status: 'pending', latency: null },
    { name: 'Supabase API', url: 'https://fzejimpdheswqrojjvmf.supabase.co/rest/v1/profiles?select=id&limit=1', status: 'pending', latency: null },
    { name: 'Supabase Auth', url: 'https://fzejimpdheswqrojjvmf.supabase.co/auth/v1/token', status: 'pending', latency: null },
  ]);
  const [logs, setLogs] = useState<string[]>([]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      addLog('Browser reported online event');
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      addLog('Browser reported offline event');
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)]);
  }, []);

  const testConnection = useCallback(async () => {
    setIsRunningTest(true);
    addLog('Starting connectivity tests...');
    
    // Test browser's online status
    const browserOnline = navigator.onLine;
    addLog(`Browser reports ${browserOnline ? 'online' : 'offline'}`);
    
    // Test our utility function
    const utilityCheck = await checkNetworkConnection();
    addLog(`Network utility reports ${utilityCheck ? 'online' : 'offline'}`);
    
    // Update status based on most reliable method
    setIsOnline(utilityCheck);
    
    // Test individual endpoints
    const newEndpoints = [...endpoints];
    
    for (let i = 0; i < newEndpoints.length; i++) {
      const endpoint = newEndpoints[i];
      addLog(`Testing endpoint: ${endpoint.name}`);
      
      try {
        const startTime = Date.now();
        const response = await fetch(endpoint.url, { 
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
          headers: {
            'Accept-Profile': 'public',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6ZWppbXBkaGVzd3Fyb2pqdm1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0ODQxODMsImV4cCI6MjA1NDA2MDE4M30.6qpLWft1lH72USjBjmPd7enwQ0sy06ouZkds64UZVI0',
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        const endTime = Date.now();
        const latency = endTime - startTime;
        
        newEndpoints[i] = {
          ...endpoint,
          status: 'success',
          latency
        };
        
        addLog(`✅ ${endpoint.name} is reachable (${latency}ms)`);
      } catch (error) {
        newEndpoints[i] = {
          ...endpoint,
          status: 'error',
          latency: null
        };
        
        addLog(`❌ ${endpoint.name} is not reachable: ${error}`);
      }
      
      setEndpoints(newEndpoints);
    }
    
    setIsRunningTest(false);
    addLog('Connectivity tests completed');
  }, [endpoints, addLog]);

  const clearLogs = useCallback(() => {
    addLog('Cleared logs');
    setLogs([]);
    setEndpoints(endpoints.map(e => ({ ...e, status: 'pending', latency: null })));
  }, [endpoints, addLog]);

  return {
    isInDevMode,
    isOnline,
    isRunningTest,
    endpoints,
    logs,
    testConnection,
    clearLogs
  };
}
