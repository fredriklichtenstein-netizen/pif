
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Wifi, WifiOff } from "lucide-react";
import { setupNetworkMonitoring } from "@/hooks/auth/networkUtils";
import { useToast } from "@/hooks/use-toast";

export function MainHeader() {
  const [isOnline, setIsOnline] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const cleanup = setupNetworkMonitoring((online) => {
      setIsOnline(online);
      
      if (online && !isOnline) {
        toast({
          title: "Connection restored",
          description: "You're back online!",
          duration: 3000,
        });
      }
    });
    
    return cleanup;
  }, [isOnline, toast]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl text-primary">PIF</span>
          </Link>
        </div>
        
        {/* Main navigation */}
        <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
          <Link to="/" className="text-sm font-medium transition-colors hover:text-primary">
            Home
          </Link>
          <Link to="/map" className="text-sm font-medium transition-colors hover:text-primary">
            Map
          </Link>
          <Link to="/post" className="text-sm font-medium transition-colors hover:text-primary">
            Post Item
          </Link>
        </nav>
        
        <div className="ml-auto flex items-center space-x-4">
          {/* Network status indicator */}
          {!isOnline && (
            <div className="flex items-center text-destructive text-sm" title="Connection issue">
              <WifiOff className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Offline</span>
            </div>
          )}
          
          {/* Always place online indicator for visual continuity */}
          {isOnline && (
            <div className="flex items-center text-green-500 text-sm" title="Connected">
              <Wifi className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Online</span>
            </div>
          )}
          
          {/* User menu or login button would go here */}
        </div>
      </div>
    </header>
  );
}
