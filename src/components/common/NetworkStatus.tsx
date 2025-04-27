
import { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, WifiOff, CheckCircle2 } from 'lucide-react';

interface NetworkStatusProps {
  onRetry?: () => void;
  className?: string;
  showOnlineStatus?: boolean;
}

export function NetworkStatus({ 
  onRetry, 
  className = '',
  showOnlineStatus = false
}: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (!showOnlineStatus) return;
      
      setShowSuccessMessage(true);
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showOnlineStatus]);
  
  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } catch (error) {
      console.error('Error during retry:', error);
    } finally {
      setIsRetrying(false);
    }
  };
  
  // Don't show anything when online and success message is hidden
  if (isOnline && !showSuccessMessage) return null;
  
  if (isOnline && showSuccessMessage) {
    return (
      <Alert className={`bg-green-50 border-green-200 text-green-800 ${className} transition-all`}>
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle>Connected</AlertTitle>
        <AlertDescription>
          Your connection has been restored.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!isOnline) {
    return (
      <Alert variant="destructive" className={className}>
        <WifiOff className="h-4 w-4" />
        <AlertTitle>You are offline</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>Check your connection and try again.</span>
          {onRetry && (
            <Button 
              onClick={handleRetry} 
              variant="outline" 
              size="sm" 
              className="ml-2 bg-white"
              disabled={isRetrying}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Reconnecting...' : 'Reconnect'}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
}
