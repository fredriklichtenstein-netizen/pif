
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { checkNetworkConnection } from "@/hooks/auth/networkUtils";
import { useNavigate } from "react-router-dom";
import { MainNav } from "@/components/MainNav";
import { NetworkStatus } from "@/components/common/NetworkStatus";
import { isNetworkError } from "@/utils/connectionRetryUtils";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasNetworkError, setHasNetworkError] = useState(false);
  
  // Function to handle network retries
  const handleRetry = async () => {
    setLoading(true);
    setHasNetworkError(false);
    
    try {
      const isOnline = await checkNetworkConnection();
      
      if (isOnline) {
        toast({
          title: "Connection restored",
          description: "Welcome to PIF! You're now connected.",
          duration: 3000,
        });
      } else {
        setHasNetworkError(true);
        toast({
          variant: "destructive",
          title: "Connection issues",
          description: "Please check your internet and try again.",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Network check failed:", error);
      setHasNetworkError(true);
      
      // Check if it's a network error
      if (isNetworkError(error)) {
        toast({
          variant: "destructive",
          title: "Network connectivity issue",
          description: "Cannot connect to servers. Please check your connection.",
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Initial network check
  useEffect(() => {
    handleRetry();
    
    // Listen for online/offline events
    const handleOnline = () => {
      if (hasNetworkError) handleRetry();
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <div className="container max-w-md mx-auto px-4 pb-20">
      <div className="pt-4">
        {/* Network status banner */}
        <NetworkStatus onRetry={handleRetry} />
        
        {/* Welcome message */}
        <div className="text-center my-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to PIF</h1>
          <p className="text-muted-foreground">
            Pay It Forward - A sustainable sharing community
          </p>
        </div>
        
        {/* Loading state */}
        {loading && (
          <div className="flex justify-center my-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {/* Content area */}
        <div className="space-y-6">
          {/* App features */}
          <div className="grid grid-cols-2 gap-4">
            <div 
              className="bg-primary/10 p-6 rounded-lg text-center cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={() => navigate("/map")}
            >
              <h2 className="text-primary font-medium mb-2">Discover Items</h2>
              <p className="text-sm">Find items near you on the map</p>
            </div>
            
            <div 
              className="bg-primary/10 p-6 rounded-lg text-center cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={() => navigate("/post")}
            >
              <h2 className="text-primary font-medium mb-2">Share Items</h2>
              <p className="text-sm">Post your items to share with others</p>
            </div>
          </div>
          
          {/* Value proposition */}
          <div className="bg-background border rounded-lg p-6 mt-8">
            <h2 className="text-xl font-semibold mb-4">Why PIF?</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>Reduce waste through sharing economy</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>Connect with your local community</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>Foster sustainable living practices</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>Give items a second life</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <MainNav />
    </div>
  );
}
