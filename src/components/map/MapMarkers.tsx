import { useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import type { Post } from "@/types/post";
import { useMapMarkers } from "./useMapMarkers";

interface MapMarkersProps {
  map: mapboxgl.Map;
  posts: Post[];
}

export const MapMarkers = ({ map, posts }: MapMarkersProps) => {
  const navigate = useNavigate();
  
  console.log("MapMarkers rendering with:", { 
    mapLoaded: map?.loaded(), 
    postsCount: posts?.length,
    postsWithCoordinates: posts?.filter(p => p.coordinates).length 
  });
  
  const markers = useMapMarkers(map, posts, (postId) => {
    console.log("Navigating to post:", postId);
    navigate(`/?post=${postId}`);
  });

  return null;
};