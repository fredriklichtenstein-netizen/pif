import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useQuery } from "@tanstack/react-query";
import { getPosts } from "./Index";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import type { Post } from "@/types/post";

const MapView = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const navigate = useNavigate();
  const [mapboxToken, setMapboxToken] = useState("");

  const { data: posts } = useQuery<Post[]>({
    queryKey: ["posts"],
    queryFn: getPosts,
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [18.0686, 59.3293], // Stockholm center
      zoom: 11,
    });

    newMap.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current = newMap;

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  // Handle markers
  useEffect(() => {
    if (!map.current || !posts) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers
    posts.forEach((post) => {
      if (!post.coordinates) return;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="max-w-xs">
          <img src="${post.images[0]}" alt="${post.title}" class="w-full h-32 object-cover rounded-lg mb-2"/>
          <h3 class="font-semibold">${post.title}</h3>
          <p class="text-sm text-gray-600">${post.category}</p>
        </div>
      `);

      const el = document.createElement("div");
      el.className = "w-4 h-4 bg-primary rounded-full cursor-pointer";

      const marker = new mapboxgl.Marker(el)
        .setLngLat([post.coordinates.lng, post.coordinates.lat])
        .setPopup(popup)
        .addTo(map.current);

      el.addEventListener("click", () => {
        popup.addTo(map.current!);
        navigate(`/?post=${post.id}`);
      });

      markers.current.push(marker);
    });

    return () => {
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
    };
  }, [posts, navigate]);

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
      <div className="h-[calc(100vh-200px)] rounded-lg overflow-hidden">
        <div ref={mapContainer} className="w-full h-full" />
      </div>
    </div>
  );
};

export default MapView;