
import { useState, useEffect } from "react";
import { AlertCircle, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { checkNetworkConnection } from "@/hooks/auth/networkUtils";
import { useToast } from "@/hooks/use-toast";

interface NetworkStatusProps {
  onRetry?: () => void;
}

export function NetworkStatus({ onRetry }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [checking, setChecking] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const { toast } = useToast();

  // Setup network monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(false);
      toast({
        title: "Connection restored",
        description: "You're back online. Real-time updates resumed.",
        duration: 3000,
      });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };
    
    // Initial check
    checkNetworkConnection().then(online => {
      setIsOnline(online);
      setShowBanner(!online);
    });
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Periodic check every 30 seconds
    const intervalId = setInterval(async () => {
      const online = await checkNetworkConnection();
      if (online !== isOnline) {
        setIsOnline(online);
        setShowBanner(!online);
        
        if (online && !isOnline) {
          toast({
            title: "Connection restored",
            description: "You're back online. Real-time updates resumed.",
            duration: 3000,
          });
        }
      }
    }, 30000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isOnline, toast]);

  const handleManualCheck = async () => {
    setChecking(true);
    try {
      const result = await checkNetworkConnection();
      setIsOnline(result);
      
      if (result) {
        toast({
          title: "Connection verified",
          description: "Your internet connection is working properly.",
          duration: 3000,
        });
        setShowBanner(false);
        
        if (onRetry) onRetry();
      } else {
        toast({
          variant: "destructive",
          title: "Connection issues persist",
          description: "Please check your internet connection and try again.",
          duration: 5000,
        });
      }
    } catch (e) {
      console.error("Error checking connection:", e);
    } finally {
      setChecking(false);
    }
  };

  if (!showBanner) return null;

  return (
    <Alert variant="destructive" className="mb-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          <AlertDescription className="text-sm">
            {isOnline ? 
              "Connection limited. Some real-time updates may be delayed." : 
              "Connection Error. Live updates unavailable. Data may not be real-time."}
          </AlertDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleManualCheck}
          disabled={checking}
          className="ml-2 flex-shrink-0"
        >
          {checking ? (
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3 mr-1" />
          )}
          Retry
        </Button>
      </div>
    </Alert>
  );
}
