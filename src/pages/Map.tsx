import { useState, useEffect } from "react";
import { MapContainer } from "@/components/map/MapContainer";
import { getPosts } from "@/services/posts";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useMapbox } from "@/hooks/useMapbox";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainNav } from "@/components/MainNav";

export default function Map() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = searchParams.get("location");
  const { mapToken, isLoading: isTokenLoading, error: tokenError, retryFetchToken } = useMapbox();
  const { toast } = useToast();

  const { data: posts = [], isLoading: isPostsLoading, error: postsError, refetch: refetchPosts } = useQuery({
    queryKey: ['map-posts'],
    queryFn: getPosts,
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

  const isLoading = isTokenLoading || isPostsLoading;
  const error = tokenError || postsError;

  const navHeight = 68;

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 z-0">
      <div
        className="absolute top-0 left-0 right-0"
        style={{
          bottom: navHeight - 10,
        }}
      >
        {error ? (
          <div className="w-full h-full bg-gray-50 flex items-center justify-center">
            <div className="text-center p-6 max-w-md">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-gray-700 mb-2 text-lg font-medium">Failed to load map</p>
              <p className="text-gray-500 text-sm mb-6">
                {tokenError ? "Failed to send a request to the Edge Function" : error.message}
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
        ) : isLoading || !mapToken || !posts ? (
          <div className="w-full h-full bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading map...</p>
              {isTokenLoading && <p className="text-xs text-gray-400 mt-2">Retrieving map credentials...</p>}
              {isPostsLoading && <p className="text-xs text-gray-400 mt-2">Loading location data...</p>}
            </div>
          </div>
        ) : (
          <MapContainer 
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
