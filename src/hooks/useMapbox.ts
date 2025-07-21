
import { useState, useEffect } from "react";
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
        setError(null);
        
        // Use the fallback token directly for now
        const fallbackToken = "pk.eyJ1IjoibG92YWJsZS1kZXYiLCJhIjoiY2xvNXAyMXgyMDF6NjJrcWR4ZXpmMzRzaSJ9.4ZhgGVjk8xfNQnvwtcMrcw";
        
        console.log("Using Mapbox token");
        setMapToken(fallbackToken);
        setIsLoading(false);
      } catch (error) {
        console.error("Error with Mapbox token:", error);
        setError(error as Error);
        setIsLoading(false);
      }
    };

    fetchMapToken();
  }, [toast]);

  const retryFetchToken = () => {
    setError(null);
    setIsLoading(true);
  };

  return { mapToken, isLoading, error, retryFetchToken };
};
