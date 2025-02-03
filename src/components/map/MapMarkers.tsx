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
  
  useMapMarkers(map, posts, (postId) => {
    console.log("Navigating to post:", postId);
    navigate(`/?post=${postId}`);
  });

  return null;
};