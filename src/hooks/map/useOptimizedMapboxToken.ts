
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useMapLoadingState, MapLoadingPhase } from "./useMapLoadingState";

interface MapboxResponse {
  token: string;
  expiresIn?: number;
}

// Time constants
const ONE_HOUR_MS = 3600000;
const ONE_DAY_MS = ONE_HOUR_MS * 24;

// Local storage keys
const TOKEN_KEY = 'mapbox_token';
const TOKEN_EXPIRY_KEY = 'mapbox_token_expiry';

// Function to fetch token from Supabase edge function
const fetchMapboxToken = async (): Promise<MapboxResponse> => {
  // Try to get token from localStorage cache first
  const cachedToken = localStorage.getItem(TOKEN_KEY);
  const tokenExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  // If we have a cached token that's not expired, use it
  if (cachedToken && tokenExpiry && parseInt(tokenExpiry) > Date.now()) {
    console.log("Using cached Mapbox token");
    return { token: cachedToken, expiresIn: Math.floor((parseInt(tokenExpiry) - Date.now()) / 1000) };
  }
  
  console.log("Fetching Mapbox token...");
  const { data, error } = await supabase.functions.invoke<MapboxResponse>("get-mapbox-token");
  
  if (error) {
    console.error("Supabase function error:", error);
    throw new Error(`Failed to fetch Mapbox token: ${error.message}`);
  }
  
  if (!data || !data.token) {
    console.error("No token returned from server");
    throw new Error("No Mapbox token returned from server");
  }
  
  console.log("Mapbox token retrieved successfully");
  
  // Cache token - default to 1 hour if no expiry provided
  const expiresIn = data.expiresIn || 3600; // Default 1 hour in seconds
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(TOKEN_EXPIRY_KEY, (Date.now() + (expiresIn * 1000)).toString());
  
  return data;
};

export const useOptimizedMapboxToken = () => {
  const { toast } = useToast();
  const { setPhase, setError } = useMapLoadingState();
  
  // Set up the React Query hook for fetching the token
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['mapbox-token'],
    queryFn: fetchMapboxToken,
    staleTime: ONE_HOUR_MS, // Consider the data fresh for 1 hour
    gcTime: ONE_DAY_MS,  // Fixed: renamed cacheTime to gcTime (garbage collection time)
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  useEffect(() => {
    // Update loading state
    if (isLoading) {
      setPhase(MapLoadingPhase.TOKEN_LOADING);
    }
  }, [isLoading, setPhase]);

  useEffect(() => {
    // Handle errors
    if (error) {
      console.error("Error fetching Mapbox token:", error);
      setError(error as Error);
      
      // For development, use a fallback token if edge function fails
      console.log("Using fallback mapbox token for development");
      const fallbackToken = "pk.eyJ1IjoibG92YWJsZS1kZXYiLCJhIjoiY2xvNXAyMXgyMDF6NjJrcWR4ZXpmMzRzaSJ9.4ZhgGVjk8xfNQnvwtcMrcw";
      localStorage.setItem(TOKEN_KEY, fallbackToken);
      localStorage.setItem(TOKEN_EXPIRY_KEY, (Date.now() + ONE_HOUR_MS).toString());
      
      toast({
        title: "Map Loading Issue",
        description: "Using fallback map configuration. Some features may be limited.",
        variant: "default",
      });
    }
  }, [error, toast, setError]);

  // Function to manually retry fetching the token
  const retryFetchToken = () => {
    // Remove cached token to force a fresh fetch
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    refetch();
  };

  return {
    mapToken: data?.token || "", 
    isLoading, 
    error, 
    retryFetchToken
  };
};
