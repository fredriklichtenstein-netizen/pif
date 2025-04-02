import { useState, useEffect } from "react";
import { MapContainer } from "@/components/map/MapContainer";
import { getPosts } from "@/services/posts";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/toaster";
import { useMapbox } from "@/hooks/useMapbox";
import { AlertCircle } from "lucide-react";

export default function Map() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = searchParams.get("location");
  const { mapToken, isLoading: isTokenLoading, error: tokenError } = useMapbox();
  const toast = useToast();

  const { data: posts = [], isLoading, error } = useQuery({
    queryKey: ['map-posts'],
    queryFn: getPosts
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading items",
        description: "Could not load items. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handlePostClick = (postId: string) => {
    navigate(`/?post=${postId}`);
  };

  const isLoading = isTokenLoading || isLoading;
  const error = tokenError || error;

  return (
    <div className="container mx-auto px-4 pb-20 pt-4">
      <div className="h-[calc(100vh-170px)] rounded-lg overflow-hidden relative">
        {error ? (
          <div className="w-full h-full bg-gray-50 flex items-center justify-center">
            <div className="text-center p-6">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-gray-700 mb-2">Failed to load map</p>
              <p className="text-gray-500 text-sm">{error.message}</p>
            </div>
          </div>
        ) : isLoading || !mapToken || !posts ? (
          <div className="w-full h-full bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading map...</p>
              {isTokenLoading && <p className="text-xs text-gray-400 mt-2">Retrieving map credentials...</p>}
              {isLoading && <p className="text-xs text-gray-400 mt-2">Loading location data...</p>}
            </div>
          </div>
        ) : (
          <MapContainer 
            mapboxToken={mapToken}
            posts={posts}
            onPostClick={handlePostClick}
          />
        )}
      </div>
      <Toaster />
    </div>
  );
}
