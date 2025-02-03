import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPosts } from "./Index";
import { MapContainer } from "@/components/map/MapContainer";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";

const MapView = () => {
  const [mapboxToken, setMapboxToken] = useState<string>("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = searchParams.get("location");

  const { data: posts } = useQuery({
    queryKey: ["posts"],
    queryFn: getPosts,
  });

  // Fetch Mapbox token
  useQuery({
    queryKey: ["mapbox-token"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-mapbox-token");
      if (error) throw error;
      setMapboxToken(data.token);
      return data.token;
    },
  });

  const handlePostClick = (postId: string) => {
    navigate(`/?post=${postId}`);
  };

  return (
    <div className="container mx-auto px-4 pb-20 pt-4">
      <h1 className="text-2xl font-bold mb-4">Map View</h1>
      {mapboxToken && posts ? (
        <MapContainer 
          mapboxToken={mapboxToken}
          posts={posts}
          onPostClick={handlePostClick}
        />
      ) : (
        <div className="max-w-md mx-auto space-y-4">
          <p className="text-gray-600">Loading map...</p>
        </div>
      )}
    </div>
  );
};

export default MapView;