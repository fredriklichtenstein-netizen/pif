
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MapboxResponse {
  token: string;
}

export const useMapbox = () => {
  const { toast } = useToast();
  const [mapToken, setMapToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    const fetchMapToken = async () => {
      try {
        setIsLoading(true);
        
        // Try to get token from localStorage cache first
        const cachedToken = localStorage.getItem('mapbox_token');
        const tokenExpiry = localStorage.getItem('mapbox_token_expiry');
        
        // If we have a cached token that's not expired, use it
        if (cachedToken && tokenExpiry && parseInt(tokenExpiry) > Date.now()) {
          console.log("Using cached Mapbox token");
          setMapToken(cachedToken);
          setIsLoading(false);
          return;
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
        setMapToken(data.token);
        
        // Cache token for 1 hour
        localStorage.setItem('mapbox_token', data.token);
        localStorage.setItem('mapbox_token_expiry', (Date.now() + 3600000).toString());
        
        setError(null);
      } catch (error) {
        console.error("Error fetching Mapbox token:", error);
        setError(error as Error);
        
        // Implement retry logic
        if (retryCount.current < maxRetries) {
          const retryDelay = Math.pow(2, retryCount.current) * 1000; // Exponential backoff
          retryCount.current += 1;
          console.log(`Retrying to fetch Mapbox token (${retryCount.current}/${maxRetries}) in ${retryDelay}ms`);
          
          setTimeout(() => {
            fetchMapToken();
          }, retryDelay);
          
          return;
        }
        
        toast({
          title: "Map Loading Error",
          description: "Could not load map functionality. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMapToken();
  }, [toast]);

  // Function to manually retry fetching the token
  const retryFetchToken = () => {
    retryCount.current = 0;
    setError(null);
    setIsLoading(true);
    // Remove cached token to force a fresh fetch
    localStorage.removeItem('mapbox_token');
    localStorage.removeItem('mapbox_token_expiry');
  };

  return { mapToken, isLoading, error, retryFetchToken };
};
