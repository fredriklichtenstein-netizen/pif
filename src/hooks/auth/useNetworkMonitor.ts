
import { useState, useEffect } from "react";
import { checkNetworkConnection } from "./networkUtils";

/**
 * Hook to monitor network status and provide network error state
 */
export function useNetworkMonitor() {
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<boolean>(true);

  // Reset network error on component mount
  useEffect(() => {
    setNetworkError(null);
  }, []);

  // Monitor for network issues
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await checkNetworkConnection();
      setConnectionStatus(isConnected);
      
      if (!isConnected && !networkError) {
        setNetworkError("Network connection issue. Please check your internet connection.");
      } else if (isConnected && networkError) {
        // Only clear the network error if it was specifically about connection issues
        if (networkError.includes("connection") || networkError.includes("internet")) {
          setNetworkError(null);
        }
      }
    };
    
    // Check connection on mount
    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, [networkError]);

  const handleOnline = () => {
    // Only clear the network error if it was specifically about connection issues
    if (networkError && (networkError.includes("connection") || networkError.includes("internet"))) {
      setNetworkError(null);
    }
    setConnectionStatus(true);
  };

  const handleOffline = () => {
    setNetworkError("Network connection lost. Please check your internet connection.");
    setConnectionStatus(false);
  };

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [networkError]);

  const clearNetworkError = () => {
    setNetworkError(null);
  };

  return {
    networkError,
    connectionStatus,
    clearNetworkError
  };
}
