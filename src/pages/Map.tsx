import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useQuery } from "@tanstack/react-query";
import { getPosts } from "./Index";
import { useNavigate } from "react-router-dom";
import { Map as MapIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Post } from "@/types/post";

// Function to add random offset to coordinates
const addLocationNoise = (lat: number, lng: number, isDenseArea: boolean) => {
  // Convert radius to degrees (approximate)
  const radiusInDegrees = isDenseArea ? 0.001 : 0.045; // ~100m or ~5km
  const angle = Math.random() * 2 * Math.PI;
  const radius = Math.random() * radiusInDegrees;

  return {
    lat: lat + radius * Math.cos(angle),
    lng: lng + radius * Math.sin(angle),
  };
};

// Mock function to determine if area is densely populated
const isDenselyPopulated = (lat: number, lng: number) => {
  return lat > 55 && lat < 65;
};

const MapView = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const navigate = useNavigate();
  const [mapboxToken, setMapboxToken] = useState("");

  const { data: posts } = useQuery<Post[]>({
    queryKey: ["posts"],
    queryFn: getPosts,
  });

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [18.0686, 59.3293], // Stockholm center
      zoom: 11,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Add markers when posts data changes
  useEffect(() => {
    if (!map.current || !posts) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    posts.forEach((post) => {
      // Mock coordinates for demo - in real app, these would come from the post data
      const baseCoords = {
        lat: 59.3293 + (Math.random() - 0.5) * 0.1,
        lng: 18.0686 + (Math.random() - 0.5) * 0.1,
      };

      const isDense = isDenselyPopulated(baseCoords.lat, baseCoords.lng);
      const { lat, lng } = addLocationNoise(baseCoords.lat, baseCoords.lng, isDense);

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="max-w-xs">
          <img src="${post.images[0]}" alt="${post.title}" class="w-full h-32 object-cover rounded-lg mb-2"/>
          <h3 class="font-semibold">${post.title}</h3>
          <p class="text-sm text-gray-600">${post.category}</p>
        </div>
      `);

      // Create marker element
      const el = document.createElement("div");
      el.className = "w-4 h-4 bg-primary rounded-full cursor-pointer";

      // Create and add the marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current!);

      // Add click handler to navigate to post
      el.addEventListener("click", () => {
        popup.addTo(map.current!);
        navigate(`/?post=${post.id}`);
      });

      markersRef.current.push(marker);
    });
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