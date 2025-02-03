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
  
  const markers = useMapMarkers(map, posts, (postId) => {
    navigate(`/?post=${postId}`);
  });

  return null;
};