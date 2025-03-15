
import { useQuery } from "@tanstack/react-query";
import { getPosts } from "./Index";
import { MapContainer } from "@/components/map/MapContainer";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/toaster";
import { useMapbox } from "@/hooks/useMapbox";
import { AlertCircle } from "lucide-react";

const MapView = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = searchParams.get("location");
  const { mapToken, isLoading: isTokenLoading, error: tokenError } = useMapbox();

  const { data: posts, isLoading: isLoadingPosts, error: postsError } = useQuery({
    queryKey: ["posts"],
    queryFn: getPosts,
  });

  const handlePostClick = (postId: string) => {
    navigate(`/?post=${postId}`);
  };

  const isLoading = isTokenLoading || isLoadingPosts;
  const error = tokenError || postsError;

  return (
    <div className="container mx-auto px-4 pb-20 pt-4">
      <h1 className="text-2xl font-bold mb-4">Map View</h1>
      <div className="h-[calc(100vh-200px)] rounded-lg overflow-hidden relative">
        {error ? (
          <div className="w-full h-full bg-gray-50 flex items-center justify-center">
            <div className="text-center p-6">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-gray-700 mb-2">Failed to load map</p>
              <p className="text-gray-500 text-sm">{error.message}</p>
            </div>
          </div>
        ) : isLoading || !mapToken || !posts ? (
          <div className="w-full h-full bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading map...</p>
              {isTokenLoading && <p className="text-xs text-gray-400 mt-2">Retrieving map credentials...</p>}
              {isLoadingPosts && <p className="text-xs text-gray-400 mt-2">Loading location data...</p>}
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
      <Toaster />
    </div>
  );
};

export default MapView;
