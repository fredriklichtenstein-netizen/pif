
import { useState, useEffect } from "react";
import { MapContainer } from "@/components/map/MapContainer";
import { MainHeader } from "@/components/layout/MainHeader";
import { Separator } from "@/components/ui/separator";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { FadeIn } from "@/components/animation/FadeIn";
import { SlideIn } from "@/components/animation/SlideIn";
import { useAnnouncement } from "@/hooks/accessibility/useAnnouncement";

const MAPBOX_TOKEN = "pk.eyJ1IjoibG92YWJsZWRldiIsImEiOiJjbTNrY3lldzEwaXdsMnBxNjR4bnJ5N3ozIn0.8zM8RINXmyDqrH0e2S0VBw";

export default function Map() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { announce } = useAnnouncement();
  const { posts, isLoading, refreshPosts } = useFeedPosts();
  const [targetItemId, setTargetItemId] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />
      <Separator />
      
      <main className="relative h-[calc(100vh-73px)]" role="main" aria-label="Interactive map">
        <FadeIn>
          <div className="absolute inset-0 z-0">
            <SlideIn direction="up">
              <MapContainer
                mapboxToken={MAPBOX_TOKEN}
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
