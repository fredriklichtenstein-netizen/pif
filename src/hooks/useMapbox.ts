
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
      
      console.log("Fetching Mapbox token from edge function...");
      
      const { data, error: functionError } = await supabase.functions.invoke('get-mapbox-token');
      
      if (functionError) {
        console.error("Edge function error:", functionError);
        throw new Error(`Failed to get Mapbox token: ${functionError.message}`);
      }
      
      if (!data || !data.token) {
        console.error("No token in response:", data);
        throw new Error("No Mapbox token received from server");
      }
      
      console.log("Successfully retrieved Mapbox token");
      setMapToken(data.token);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching Mapbox token:", error);
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
    setError(null);
    fetchMapboxToken();
  };

  return { mapToken, isLoading, error, retryFetchToken };
};
