
import { useState } from "react";
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

  const { data: posts } = useQuery({
    queryKey: ["posts"],
    queryFn: getPosts,
  });

  // Fetch Mapbox token with better error handling
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

  const isReady = !!mapboxToken && !!posts && !isLoadingToken;

  return (
    <div className="container mx-auto px-4 pb-20 pt-4">
      <h1 className="text-2xl font-bold mb-4">Map View</h1>
      <div className="h-[calc(100vh-200px)] rounded-lg overflow-hidden relative">
        {!isReady ? (
          <>
            <Skeleton className="w-full h-full animate-pulse bg-gray-200" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-gray-500 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p>Loading map...</p>
              </div>
            </div>
          </>
        ) : (
          <MapContainer 
            mapboxToken={mapboxToken}
            posts={posts}
            onPostClick={handlePostClick}
            isReady={true}
          />
        )}
      </div>
      <Toaster />
    </div>
  );
};

export default MapView;
