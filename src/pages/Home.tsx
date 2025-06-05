import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { checkNetworkConnection } from "@/hooks/auth/networkUtils";
import { useNavigate } from "react-router-dom";
import { MainNav } from "@/components/MainNav";
import { NetworkStatus } from "@/components/common/NetworkStatus";
import { isNetworkError } from "@/utils/connectionRetryUtils";
import { Loader2, ArrowRight, Users, Recycle, Heart, MapPin, Gift } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-blue-50">
      <div className="container max-w-md mx-auto px-4 pb-20">
        {/* Network status banner */}
        <NetworkStatus onRetry={handleRetry} />
        
        {/* Hero Section with Logo */}
        <div className="relative pt-8 pb-8">
          {/* Background Image */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden opacity-10">
            <img 
              src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&auto=format&fit=crop&q=80"
              alt="Community sharing"
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Content over background */}
          <div className="relative text-center py-8">
            {/* PiF Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">PiF</span>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold mb-4 text-gray-800">
              Pay It Forward
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-sm mx-auto leading-relaxed">
              En plats där grannar hjälper grannar. Dela, ge och ta emot med hjärtat i centrum.
            </p>
          </div>
        </div>
        
        {/* Loading state */}
        {loading && (
          <div className="flex justify-center my-8">
            <Loader2 className="h-8 w-8 animate-spin text-green-500" />
          </div>
        )}
        
        {/* Community Stats */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-green-100 shadow-sm">
          <h3 className="text-center text-green-700 font-semibold mb-4 flex items-center justify-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Vår gemenskap växer</span>
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">🤝</div>
              <p className="text-xs text-gray-600 mt-1">Delade PiFar</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">🌱</div>
              <p className="text-xs text-gray-600 mt-1">Hållbara val</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">♻️</div>
              <p className="text-xs text-gray-600 mt-1">Cirkulär ekonomi</p>
            </div>
          </div>
        </div>
        
        {/* Action Cards */}
        <div className="space-y-4 mb-8">
          {/* Main CTA - Browse */}
          <Button
            onClick={() => navigate("/feed")}
            className="w-full h-20 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-2xl flex items-center justify-between p-6 shadow-lg transform transition-all hover:scale-105"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-full p-3">
                <Heart className="h-6 w-6" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-lg">Upptäck PiFar</h3>
                <p className="text-white/80 text-sm">Se vad som delas i ditt område</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5" />
          </Button>
          
          {/* Secondary actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => navigate("/post")}
              className="h-24 bg-gradient-to-br from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 border-2 border-green-300 rounded-2xl flex flex-col items-center justify-center space-y-2 text-green-700 transition-all"
            >
              <Gift className="h-6 w-6" />
              <div className="text-center">
                <p className="font-medium">Piffa</p>
                <p className="text-xs">Ge bort något</p>
              </div>
            </Button>
            
            <Button
              onClick={() => navigate("/map")}
              className="h-24 bg-gradient-to-br from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 border-2 border-blue-300 rounded-2xl flex flex-col items-center justify-center space-y-2 text-blue-700 transition-all"
            >
              <MapPin className="h-6 w-6" />
              <div className="text-center">
                <p className="font-medium">Utforska</p>
                <p className="text-xs">Hitta i din närhet</p>
              </div>
            </Button>
          </div>
        </div>
        
        {/* Mission Statement */}
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Varför PiF?</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border border-green-200">
              <div className="flex items-start space-x-3">
                <span className="text-green-600 text-lg">🌍</span>
                <div className="text-left">
                  <h3 className="font-medium text-green-700">Minska avfall</h3>
                  <p className="text-sm text-gray-600">Ge saker nytt liv genom delning</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-start space-x-3">
                <span className="text-blue-600 text-lg">🏘️</span>
                <div className="text-left">
                  <h3 className="font-medium text-blue-700">Bygg gemenskap</h3>
                  <p className="text-sm text-gray-600">Skapa relationer med dina grannar</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-green-50 p-4 rounded-xl border border-purple-200">
              <div className="flex items-start space-x-3">
                <span className="text-purple-600 text-lg">💚</span>
                <div className="text-left">
                  <h3 className="font-medium text-purple-700">Hållbar framtid</h3>
                  <p className="text-sm text-gray-600">En delning i taget</p>
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
