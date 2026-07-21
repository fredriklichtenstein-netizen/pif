
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { checkNetworkConnection } from "@/hooks/auth/networkUtils";
import { useNavigate } from "react-router-dom";
import { MainNav } from "@/components/MainNav";
import { MainHeader } from "@/components/layout/MainHeader";
import { InstallInstructionsBanner } from "@/components/pwa/InstallInstructionsBanner";
import { NetworkStatus } from "@/components/common/NetworkStatus";
import { isNetworkError } from "@/utils/connectionRetryUtils";
import { Loader2, ArrowRight, Heart, MapPin, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';
import { DEMO_MODE } from "@/config/demoMode";
import { LanguageSelector } from "@/components/common/LanguageSelector";
import { HowItWorksSteps } from "@/components/home/HowItWorksSteps";

export default function Home() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  // In demo mode, skip loading since we don't need to check network
  const [loading, setLoading] = useState(!DEMO_MODE);
  const [hasNetworkError, setHasNetworkError] = useState(false);
  
  // Function to handle network retries
  const handleRetry = async () => {
    if (DEMO_MODE) return; // Skip in demo mode
    
    setLoading(true);
    setHasNetworkError(false);
    
    try {
      const isOnline = await checkNetworkConnection();
      
      if (isOnline) {
        // Silent: connectivity is reflected by app working again
      } else {
        setHasNetworkError(true);
        toast({
          variant: "destructive",
          title: t('comments.connection_issue'),
          description: t('home.check_connection'),
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
          title: t('home.network_connection_problem'),
          description: t('home.cannot_connect_servers'),
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Initial network check - skip in demo mode
  useEffect(() => {
    if (DEMO_MODE) return;
    
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
    <div className="min-h-screen-dvh bg-gradient-to-br from-green-50 via-background to-blue-50">
      <MainHeader />
      <InstallInstructionsBanner />
      <div className="container max-w-md sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 py-[30px]">
        <div className="flex justify-end mb-2">
          <LanguageSelector />
        </div>

        {/* Network status banner */}
        <NetworkStatus onRetry={handleRetry} />
        
        {/* Hero Section with Logo */}
        <div className="relative pt-8 pb-8">
          {/* Background Image */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden opacity-10">
            <img 
              src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&auto=format&fit=crop&q=80"
              alt={t('home.community_sharing_alt')}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Content over background */}
          <div className="relative text-center py-8 sm:py-12 lg:py-16">
            {/* PiF Logo */}
            <div className="flex justify-center mb-6">
              <img 
                src="/lovable-uploads/a139121f-d6c7-4487-bd2e-4f530bea4e21.png"
                alt="Pay it Forward Logo"
                className="h-28 sm:h-36 lg:h-44 w-auto object-contain"
              />
            </div>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-8 max-w-sm sm:max-w-xl lg:max-w-2xl mx-auto leading-relaxed px-[10px]">
              {t('home.hero_description')}
            </p>
          </div>
        </div>
        
        {/* Loading state */}
        {loading && (
          <div className="flex justify-center my-8">
            <Loader2 className="h-8 w-8 animate-spin text-green-500" />
          </div>
        )}
        
        {/* Concepts explainer */}
        <div className="max-w-3xl mx-auto w-full mb-6 mt-8">
          <p className="text-center text-gray-600 text-sm sm:text-base mb-4 max-w-xl mx-auto px-2">
            {t('home.concepts_intro')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">🎁</span>
                <h3 className="font-semibold text-green-700">{t('home.concept_pif_title')}</h3>
              </div>
              <p className="text-sm text-gray-600">{t('home.concept_pif_description')}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-amber-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">✨</span>
                <h3 className="font-semibold text-amber-700">{t('home.concept_wish_title')}</h3>
              </div>
              <p className="text-sm text-gray-600">{t('home.concept_wish_description')}</p>
            </div>
          </div>
        </div>
        
        {/* How it works */}
        <div className="max-w-3xl mx-auto w-full mb-8">
          <h2 className="text-center text-lg sm:text-xl font-semibold text-gray-800 mb-4">
            {t('home.how_it_works_title')}
          </h2>
          <HowItWorksSteps />
        </div>

        {/* Action Cards */}
        <div className="space-y-4 mb-8 max-w-3xl mx-auto w-full">
          {/* Main CTA - Browse */}
          <Button
            onClick={() => navigate("/feed")}
            className="w-full h-20 sm:h-24 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-2xl flex items-center justify-between p-6 shadow-lg transform transition-all hover:scale-105"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-full p-3">
                <Heart className="h-6 w-6" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-base sm:text-lg">{t('home.discover_pifs')}</h3>
                <p className="text-white/80 text-xs sm:text-sm">{t('home.discover_description')}</p>
              </div>
            </div>
            
          </Button>
          
          {/* Secondary actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => navigate("/post")}
              className="h-24 sm:h-28 bg-gradient-to-br from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 border-2 border-green-300 rounded-2xl flex flex-col items-center justify-center space-y-2 text-green-700 transition-all"
            >
              <Gift className="h-6 w-6" />
              <div className="text-center">
                <p className="font-medium">{t('post.offer_action')}</p>
                <p className="text-xs">{t('home.give_away_something')}</p>
              </div>
            </Button>
            
            <Button
              onClick={() => navigate("/map")}
              className="h-24 sm:h-28 bg-gradient-to-br from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 border-2 border-blue-300 rounded-2xl flex flex-col items-center justify-center space-y-2 text-blue-700 transition-all"
            >
              <MapPin className="h-6 w-6" />
              <div className="text-center">
                <p className="font-medium">{t('home.explore')}</p>
                <p className="text-xs">{t('home.find_nearby')}</p>
              </div>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <MainNav />
    </div>
  );
}
