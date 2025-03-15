
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useMapbox = () => {
  const { toast } = useToast();
  const [mapToken, setMapToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMapToken = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching Mapbox token...");
        const { data, error } = await supabase.functions.invoke("get-mapbox-token");
        
        if (error) {
          console.error("Supabase function error:", error);
          throw error;
        }
        
        if (!data || !data.token) {
          console.error("No token returned from server");
          throw new Error("No Mapbox token returned from server");
        }
        
        console.log("Mapbox token retrieved successfully");
        setMapToken(data.token);
      } catch (error) {
        console.error("Error fetching Mapbox token:", error);
        setError(error as Error);
        toast({
          title: "Error",
          description: "Could not load map functionality. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMapToken();
  }, []);

  return { mapToken, isLoading, error };
};
