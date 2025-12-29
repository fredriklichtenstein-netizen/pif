
import { useState, useEffect } from "react";
import { MapContainer } from "@/components/map/MapContainer";
import { MainHeader } from "@/components/layout/MainHeader";
import { Separator } from "@/components/ui/separator";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { FadeIn } from "@/components/animation/FadeIn";
import { SlideIn } from "@/components/animation/SlideIn";
import { useAnnouncement } from "@/hooks/accessibility/useAnnouncement";
import { useMapbox } from "@/hooks/useMapbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, AlertCircle, MapPin, ExternalLink } from "lucide-react";
import { DEMO_MODE } from "@/config/demoMode";

export default function Map() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { announce } = useAnnouncement();
  const { posts, isLoading, refreshPosts } = useFeedPosts();
  const [targetItemId, setTargetItemId] = useState<string | null>(null);
  const { mapToken, isLoading: isTokenLoading, error: tokenError, retryFetchToken, needsToken, setDemoToken } = useMapbox();
  const [tokenInput, setTokenInput] = useState("");

  console.log("🗺️ [Map Page] Render - Posts:", posts.length, "Token loading:", isTokenLoading, "Token:", mapToken ? "✅" : "❌", "NeedsToken:", needsToken);

  // Get target item from URL parameters
  useEffect(() => {
    const itemId = searchParams.get('item');
    if (itemId) {
      console.log('🎯 [Map Page] Target item ID from URL:', itemId);
      setTargetItemId(itemId);
    } else {
      setTargetItemId(null);
    }
  }, [searchParams]);

  useEffect(() => {
    announce("Map page loaded, showing community posts on map");
    refreshPosts();
  }, [announce, refreshPosts]);

  const handlePostClick = (postId: string) => {
    console.log('🔗 [Map Page] Post clicked, navigating to feed with post:', postId);
    navigate(`/feed?post=${postId}&t=${Date.now()}`);
  };

  const handleTokenSubmit = () => {
    if (tokenInput.trim().startsWith('pk.')) {
      setDemoToken(tokenInput.trim());
    }
  };

  // Show loading state while token is being fetched
  if (isTokenLoading) {
    console.log("⏳ [Map Page] Showing token loading state");
    return (
      <div className="min-h-screen bg-gray-50">
        <MainHeader />
        <Separator />
        
        <main className="relative h-[calc(100vh-73px)] flex items-center justify-center" role="main" aria-label="Map loading">
          <div className="text-center p-6">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading map credentials...</p>
            <p className="text-gray-500 text-sm mt-2">Fetching secure Mapbox token</p>
          </div>
        </main>
      </div>
    );
  }

  // Show token input for demo mode when no token is available
  if (DEMO_MODE && needsToken) {
    console.log("🔑 [Map Page] Showing demo token input");
    return (
      <div className="min-h-screen bg-gray-50">
        <MainHeader />
        <Separator />
        
        <main className="relative h-[calc(100vh-73px)] flex items-center justify-center" role="main" aria-label="Map token required">
          <div className="text-center p-6 max-w-md">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Map requires Mapbox token</h2>
            <p className="text-gray-600 mb-4 text-sm">
              To view the interactive map in demo mode, please enter your Mapbox public token. 
              You can get one for free at mapbox.com.
            </p>
            
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="pk.eyJ1..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="text-sm"
              />
              <Button 
                onClick={handleTokenSubmit}
                disabled={!tokenInput.startsWith('pk.')}
                className="w-full"
              >
                Use Token
              </Button>
              <a 
                href="https://account.mapbox.com/access-tokens/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Get a free Mapbox token <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-800">
                <strong>Demo Mode:</strong> The map feature requires a Mapbox API token. 
                In production, this is handled automatically via the backend.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show error state if token fetch failed
  if (tokenError || !mapToken) {
    console.log("🚨 [Map Page] Showing token error state:", tokenError?.message);
    return (
      <div className="min-h-screen bg-gray-50">
        <MainHeader />
        <Separator />
        
        <main className="relative h-[calc(100vh-73px)] flex items-center justify-center" role="main" aria-label="Map error">
          <div className="text-center p-6 max-w-md">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Map Unavailable</h2>
            <p className="text-gray-600 mb-4">
              {tokenError?.message || "Unable to load map credentials. Please try again."}
            </p>
            <Button 
              onClick={retryFetchToken} 
              className="flex items-center gap-2"
              variant="default"
            >
              <RefreshCw className="h-4 w-4" /> 
              Retry
            </Button>
          </div>
        </main>
      </div>
    );
  }

  console.log("✅ [Map Page] Rendering main map interface");

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />
      <Separator />
      
      <main className="relative h-[calc(100vh-73px)]" role="main" aria-label="Interactive map">
        <FadeIn className="h-full">
          <div className="absolute inset-0 z-0">
            <SlideIn direction="up" className="h-full">
              <MapContainer
                mapboxToken={mapToken}
                posts={posts}
                onPostClick={handlePostClick}
                targetItemId={targetItemId}
              />
            </SlideIn>
          </div>
        </FadeIn>
        
        {/* Demo mode banner */}
        {DEMO_MODE && (
          <div className="absolute top-4 left-4 right-4 z-50 pointer-events-none flex justify-center">
            <div className="bg-amber-50/95 backdrop-blur-sm border border-amber-200 rounded-lg px-4 py-2 shadow-lg pointer-events-auto">
              <p className="text-xs text-amber-800 text-center">
                <strong>Demo Mode</strong> — Viewing example locations in Stockholm
              </p>
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50" style={{ marginTop: DEMO_MODE ? '48px' : 0 }}>
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">Loading posts...</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
