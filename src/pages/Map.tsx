
import { useQuery } from "@tanstack/react-query";
import { getPosts } from "./Index";
import { MapContainer } from "@/components/map/MapContainer";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";

const MapView = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = searchParams.get("location");
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  // Directly fetch Mapbox token without using query for more control
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        console.log("Fetching Mapbox token...");
        const { data, error } = await supabase.functions.invoke("get-mapbox-token");
        
        if (error) {
          console.error("Error fetching Mapbox token:", error);
          toast({
            title: "Error",
            description: "Could not load map. Please try again later.",
            variant: "destructive",
          });
          return;
        }
        
        console.log("Mapbox token received:", data?.token ? "Token exists" : "No token");
        setMapboxToken(data?.token || null);
      } catch (error) {
        console.error("Exception fetching Mapbox token:", error);
        toast({
          title: "Error",
          description: "Failed to load map. Please try again later.",
          variant: "destructive",
        });
      }
    };

    fetchMapboxToken();
  }, [toast]);

  const { data: posts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ["posts"],
    queryFn: getPosts,
  });

  const handlePostClick = (postId: string) => {
    navigate(`/?post=${postId}`);
  };

  const isLoading = isLoadingPosts || !mapboxToken;

  return (
    <div className="container mx-auto px-4 pb-20 pt-4">
      <h1 className="text-2xl font-bold mb-4">Map View</h1>
      <div className="h-[calc(100vh-200px)] rounded-lg overflow-hidden relative">
        {isLoading ? (
          <div className="w-full h-full bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        ) : (
          <MapContainer 
            mapboxToken={mapboxToken || ""}
            posts={posts || []}
            onPostClick={handlePostClick}
          />
        )}
      </div>
    </div>
  );
};

export default MapView;
