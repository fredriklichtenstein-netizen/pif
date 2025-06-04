import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { checkNetworkConnection } from "@/hooks/auth/networkUtils";
import { useNavigate } from "react-router-dom";
import { MainNav } from "@/components/MainNav";
import { NetworkStatus } from "@/components/common/NetworkStatus";
import { isNetworkError } from "@/utils/connectionRetryUtils";
import { Loader2, ArrowRight, Users, Recycle, Heart, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10">
      <div className="container max-w-md mx-auto px-4 pb-20">
        {/* Network status banner */}
        <NetworkStatus onRetry={handleRetry} />
        
        {/* Hero Section with Logo */}
        <div className="relative pt-8 pb-8">
          {/* Background Image */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden opacity-20">
            <img 
              src="https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&auto=format&fit=crop&q=80"
              alt="Nature background"
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Content over background */}
          <div className="relative text-center py-8">
            {/* PiF Logo - Using new uploaded image */}
            <div className="flex justify-center mb-8">
              <img 
                src="/lovable-uploads/d87837b9-dae7-47d1-b339-e613eb5e4ea7.png"
                alt="Pay it Forward Logo"
                className="w-32 h-32 object-contain"
              />
            </div>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
              Building a sustainable future through community sharing and circular economy
            </p>
            
            {/* Inspiring Quote */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-primary/20">
              <blockquote className="text-primary font-medium italic text-center">
                "We do not inherit the Earth from our ancestors; 
                we borrow it from our children."
              </blockquote>
              <p className="text-sm text-muted-foreground mt-2 text-center">— Ancient Proverb</p>
            </div>
          </div>
        </div>
        
        {/* Loading state */}
        {loading && (
          <div className="flex justify-center my-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {/* Action Cards */}
        <div className="space-y-4 mb-8">
          <Button
            onClick={() => navigate("/feed")}
            className="w-full h-20 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white rounded-2xl flex items-center justify-between p-6 shadow-lg transform transition-all hover:scale-105"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-full p-3">
                <Heart className="h-6 w-6" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-lg">Discover & Share</h3>
                <p className="text-white/80 text-sm">Browse community items</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5" />
          </Button>
          
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => navigate("/map")}
              variant="outline"
              className="h-24 border-2 border-primary/30 hover:border-primary rounded-2xl flex flex-col items-center justify-center space-y-2 bg-white/50 backdrop-blur-sm hover:bg-primary/5 transition-all"
            >
              <MapPin className="h-6 w-6 text-primary" />
              <div className="text-center">
                <p className="font-medium text-primary">Explore Map</p>
                <p className="text-xs text-muted-foreground">Find nearby items</p>
              </div>
            </Button>
            
            <Button
              onClick={() => navigate("/post")}
              variant="outline"
              className="h-24 border-2 border-secondary/30 hover:border-secondary rounded-2xl flex flex-col items-center justify-center space-y-2 bg-white/50 backdrop-blur-sm hover:bg-secondary/5 transition-all"
            >
              <Recycle className="h-6 w-6 text-secondary" />
              <div className="text-center">
                <p className="font-medium text-secondary">Share Items</p>
                <p className="text-xs text-muted-foreground">Give items new life</p>
              </div>
            </Button>
          </div>
        </div>
        
        {/* Impact Stats */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-primary/10">
          <h3 className="text-center text-primary font-semibold mb-4 flex items-center justify-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Community Impact</span>
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">🌱</div>
              <p className="text-xs text-muted-foreground mt-1">Sustainable Living</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary">♻️</div>
              <p className="text-xs text-muted-foreground mt-1">Circular Economy</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">🤝</div>
              <p className="text-xs text-muted-foreground mt-1">Community Building</p>
            </div>
          </div>
        </div>
        
        {/* Mission Statement */}
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-primary">Our Mission</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-xl border border-primary/20">
              <div className="flex items-start space-x-3">
                <span className="text-primary text-lg">🌍</span>
                <div className="text-left">
                  <h3 className="font-medium text-primary">Reduce Waste</h3>
                  <p className="text-sm text-muted-foreground">Give items a second life through community sharing</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-secondary/10 to-primary/10 p-4 rounded-xl border border-secondary/20">
              <div className="flex items-start space-x-3">
                <span className="text-secondary text-lg">🏘️</span>
                <div className="text-left">
                  <h3 className="font-medium text-secondary">Build Community</h3>
                  <p className="text-sm text-muted-foreground">Connect neighbors and foster local relationships</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-xl border border-primary/20">
              <div className="flex items-start space-x-3">
                <span className="text-primary text-lg">💚</span>
                <div className="text-left">
                  <h3 className="font-medium text-primary">Sustainable Future</h3>
                  <p className="text-sm text-muted-foreground">Create a more sustainable world, one share at a time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <MainNav />
    </div>
  );
}
