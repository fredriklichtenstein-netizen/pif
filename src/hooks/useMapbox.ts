
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useMapbox = () => {
  const { toast } = useToast();
  const [mapToken, setMapToken] = useState<string>("");

  useEffect(() => {
    const fetchMapToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-mapbox-token");
        if (error) throw error;
        setMapToken(data.token);
      } catch (error) {
        console.error("Error fetching Mapbox token:", error);
        toast({
          title: "Error",
          description: "Could not load map functionality. Please try again later.",
          variant: "destructive",
        });
      }
    };

    fetchMapToken();
  }, []);

  return { mapToken };
};
