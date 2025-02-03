import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPosts } from "./Index";
import { MapContainer } from "@/components/map/MapContainer";
import { MapMarkers } from "@/components/map/MapMarkers";
import mapboxgl from "mapbox-gl";
import { supabase } from "@/integrations/supabase/client";

const MapView = () => {
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>("");

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

  return (
    <div className="container mx-auto px-4 pb-20 pt-4">
      <h1 className="text-2xl font-bold mb-4">Map View</h1>
      {mapboxToken ? (
        <>
          <MapContainer 
            mapboxToken={mapboxToken} 
            onMapLoad={(map) => setMapInstance(map)} 
          />
          {mapInstance && posts && <MapMarkers map={mapInstance} posts={posts} />}
        </>
      ) : (
        <div className="max-w-md mx-auto space-y-4">
          <p className="text-gray-600">Loading map...</p>
        </div>
      )}
    </div>
  );
};

export default MapView;