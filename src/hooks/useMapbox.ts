
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useMapbox = () => {
  const { toast } = useToast();
  const [mapToken, setMapToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMapboxToken = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("🗺️ [Mapbox Hook] Starting token fetch...");
      
      const { data, error: functionError } = await supabase.functions.invoke('get-mapbox-token');
      
      if (functionError) {
        console.error("🚨 [Mapbox Hook] Edge function error:", functionError);
        throw new Error(`Failed to get Mapbox token: ${functionError.message}`);
      }
      
      if (!data || !data.token) {
        console.error("🚨 [Mapbox Hook] No token in response:", data);
        throw new Error("No Mapbox token received from server");
      }
      
      // Validate token format
      if (!data.token.startsWith('pk.')) {
        console.error("🚨 [Mapbox Hook] Invalid token format:", data.token.substring(0, 10) + "...");
        throw new Error("Invalid Mapbox token format received");
      }
      
      console.log("✅ [Mapbox Hook] Successfully retrieved valid token");
      setMapToken(data.token);
      setIsLoading(false);
    } catch (error) {
      console.error("🚨 [Mapbox Hook] Token fetch failed:", error);
      setError(error as Error);
      setIsLoading(false);
      
      toast({
        title: "Map Error",
        description: "Failed to load map credentials. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchMapboxToken();
  }, [toast]);

  const retryFetchToken = () => {
    console.log("🔄 [Mapbox Hook] Retrying token fetch...");
    setError(null);
    fetchMapboxToken();
  };

  return { mapToken, isLoading, error, retryFetchToken };
};
