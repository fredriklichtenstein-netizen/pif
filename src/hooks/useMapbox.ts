
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/config/demoMode";
import { useTranslation } from "react-i18next";

// Storage key for user-provided demo token
const DEMO_TOKEN_KEY = 'pif_demo_mapbox_token';

export const useMapbox = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [mapToken, setMapToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [needsToken, setNeedsToken] = useState(false);

  const fetchMapboxToken = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // In demo mode, check for stored token first
      if (DEMO_MODE) {
        const storedToken = localStorage.getItem(DEMO_TOKEN_KEY);
        if (storedToken && storedToken.startsWith('pk.')) {
          setMapToken(storedToken);
          setIsLoading(false);
          return;
        }
        
        // No valid token available in demo mode
        setNeedsToken(true);
        setIsLoading(false);
        return;
      }
      const { data, error: functionError } = await supabase.functions.invoke('get-mapbox-token');
      
      if (functionError) {
        console.error("🚨 [Mapbox Hook] Edge function error:", functionError);
        throw new Error("Kunde inte ladda kartan. Försök igen.");
      }
      
      if (!data || !data.token) {
        console.error("🚨 [Mapbox Hook] No token in response:", data);
        throw new Error("Kunde inte ladda kartan. Försök igen.");
      }
      
      // Validate token format
      if (!data.token.startsWith('pk.')) {
        console.error("🚨 [Mapbox Hook] Invalid token format:", data.token.substring(0, 10) + "...");
        throw new Error("Kunde inte ladda kartan. Försök igen.");
      }
      setMapToken(data.token);
      setIsLoading(false);
    } catch (error) {
      console.error("🚨 [Mapbox Hook] Token fetch failed:", error);
      setError(error as Error);
      setIsLoading(false);
      
      toast({
        title: t('interactions.map_error'),
        description: t('interactions.map_error_description'),
        variant: "destructive",
      });
    }
  };

  const setDemoToken = (token: string) => {
    if (token && token.startsWith('pk.')) {
      localStorage.setItem(DEMO_TOKEN_KEY, token);
      setMapToken(token);
      setNeedsToken(false);
    }
  };

  useEffect(() => {
    fetchMapboxToken();
  }, [toast]);

  const retryFetchToken = () => {
    setError(null);
    fetchMapboxToken();
  };

  return { mapToken, isLoading, error, retryFetchToken, needsToken, setDemoToken };
};
