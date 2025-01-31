import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPosts } from "./Index";
import { Input } from "@/components/ui/input";
import { MapContainer } from "@/components/map/MapContainer";
import { MapMarkers } from "@/components/map/MapMarkers";
import mapboxgl from "mapbox-gl";

const MapView = () => {
  const [mapboxToken, setMapboxToken] = useState("");
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);

  const { data: posts } = useQuery({
    queryKey: ["posts"],
    queryFn: getPosts,
  });

  if (!mapboxToken) {
    return (
      <div className="container mx-auto px-4 pb-20 pt-4">
        <h1 className="text-2xl font-bold mb-4">Map View</h1>
        <div className="max-w-md mx-auto space-y-4">
          <p className="text-gray-600">
            Please enter your Mapbox public token to view the map. You can get one
            from{" "}
            <a
              href="https://mapbox.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Mapbox
            </a>
          </p>
          <Input
            type="text"
            placeholder="Enter Mapbox token"
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pb-20 pt-4">
      <h1 className="text-2xl font-bold mb-4">Map View</h1>
      <MapContainer 
        mapboxToken={mapboxToken} 
        onMapLoad={(map) => setMapInstance(map)} 
      />
      {mapInstance && posts && <MapMarkers map={mapInstance} posts={posts} />}
    </div>
  );
};

export default MapView;