
import { useEffect } from "react";
import { EnhancedMapContainer } from "@/components/map/EnhancedMapContainer";
import { getPosts } from "@/services/posts";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useOptimizedMapboxToken } from "@/hooks/map/useOptimizedMapboxToken";
import { MainNav } from "@/components/MainNav";
import { useMapLoadingState, MapLoadingPhase } from "@/hooks/map/useMapLoadingState";

export default function Map() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = searchParams.get("location");
  const { mapToken, error: tokenError, retryFetchToken } = useOptimizedMapboxToken();
  const { toast } = useToast();
  const { setPhase, setError } = useMapLoadingState();

  // Optimized useQuery implementation with more cache control
  const { 
    data: posts = [], 
    error: postsError, 
    refetch: refetchPosts 
  } = useQuery({
    queryKey: ['map-posts'],
    queryFn: async () => {
      setPhase(MapLoadingPhase.POSTS_LOADING);
      try {
        return await getPosts();
      } catch (error) {
        setError(error as Error);
        throw error;
      }
    },
    staleTime: 60000, // Data remains fresh for 1 minute
    cacheTime: 300000, // Cache persists for 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  useEffect(() => {
    if (postsError) {
      console.error("Error loading posts:", postsError);
      toast({
        title: "Error loading items",
        description: "Could not load items. Please try again later.",
        variant: "destructive",
      });
    }
  }, [postsError, toast]);

  const handlePostClick = (postId: string) => {
    navigate(`/?post=${postId}`);
  };
  
  const handleRetry = () => {
    if (tokenError) {
      retryFetchToken();
    }
    if (postsError) {
      refetchPosts();
    }
  };

  const navHeight = 68;

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 z-0">
      <div
        className="absolute top-0 left-0 right-0"
        style={{
          bottom: navHeight - 10,
        }}
      >
        {tokenError || postsError ? (
          <div className="w-full h-full bg-gray-50 flex items-center justify-center">
            <div className="text-center p-6 max-w-md">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-gray-700 mb-2 text-lg font-medium">Failed to load map</p>
              <p className="text-gray-500 text-sm mb-6">
                {tokenError ? "Failed to send a request to the Edge Function" : postsError.message}
              </p>
              <Button 
                onClick={handleRetry} 
                className="flex items-center gap-2"
                variant="default"
              >
                <RefreshCw className="h-4 w-4" /> Try again
              </Button>
            </div>
          </div>
        ) : (
          <EnhancedMapContainer 
            mapboxToken={mapToken}
            posts={posts}
            onPostClick={handlePostClick}
          />
        )}
      </div>
      <div className="fixed left-0 right-0 bottom-0 z-10">
        <MainNav />
      </div>
      <Toaster />
    </div>
  );
}

// Import needed components
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
