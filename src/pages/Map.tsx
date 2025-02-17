
import { useQuery } from "@tanstack/react-query";
import { getPosts } from "./Index";
import { MapContainer } from "@/components/map/MapContainer";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/toaster";

const MapView = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = searchParams.get("location");

  const { data: posts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ["posts"],
    queryFn: getPosts,
  });

  const { data: mapboxToken, isLoading: isLoadingToken } = useQuery({
    queryKey: ["mapbox-token"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-mapbox-token");
      if (error) throw error;
      return data.token;
    },
  });

  const handlePostClick = (postId: string) => {
    navigate(`/?post=${postId}`);
  };

  const isLoading = isLoadingToken || isLoadingPosts;

  return (
    <div className="container mx-auto px-4 pb-20 pt-4">
      <h1 className="text-2xl font-bold mb-4">Map View</h1>
      <div className="h-[calc(100vh-200px)] rounded-lg overflow-hidden relative">
        {isLoading || !mapboxToken || !posts ? (
          <div className="w-full h-full bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        ) : (
          <MapContainer 
            mapboxToken={mapboxToken}
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
