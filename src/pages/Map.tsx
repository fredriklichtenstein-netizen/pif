
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
import { RefreshCw, AlertCircle } from "lucide-react";

export default function Map() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { announce } = useAnnouncement();
  const { posts, isLoading, refreshPosts } = useFeedPosts();
  const [targetItemId, setTargetItemId] = useState<string | null>(null);
  const { mapToken, isLoading: isTokenLoading, error: tokenError, retryFetchToken } = useMapbox();

  // Get target item from URL parameters
  useEffect(() => {
    const itemId = searchParams.get('item');
    if (itemId) {
      console.log('Map: Target item ID from URL:', itemId);
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
    console.log('Map: Post clicked, navigating to feed with post:', postId);
    // Navigate to feed with the specific post ID and timestamp
    navigate(`/feed?post=${postId}&t=${Date.now()}`);
  };

  // Show loading state while token is being fetched
  if (isTokenLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainHeader />
        <Separator />
        
        <main className="relative h-[calc(100vh-73px)] flex items-center justify-center" role="main" aria-label="Map loading">
          <div className="text-center p-6">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading map credentials...</p>
            <p className="text-gray-500 text-sm mt-2">Initializing secure connection</p>
          </div>
        </main>
      </div>
    );
  }

  // Show error state if token fetch failed
  if (tokenError || !mapToken) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />
      <Separator />
      
      <main className="relative h-[calc(100vh-73px)]" role="main" aria-label="Interactive map">
        <FadeIn>
          <div className="absolute inset-0 z-0">
            <SlideIn direction="up">
              <MapContainer
                mapboxToken={mapToken}
                posts={posts}
                onPostClick={handlePostClick}
                targetItemId={targetItemId}
              />
            </SlideIn>
          </div>
        </FadeIn>
        
        {isLoading && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
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
