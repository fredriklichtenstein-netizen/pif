
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
        console.log("🗺️ [Mapbox Hook] Demo mode - checking for stored token");
        const storedToken = localStorage.getItem(DEMO_TOKEN_KEY);
        if (storedToken && storedToken.startsWith('pk.')) {
          console.log("✅ [Mapbox Hook] Using stored demo token");
          setMapToken(storedToken);
          setIsLoading(false);
          return;
        }
        
        // No valid token available in demo mode
        console.log("⚠️ [Mapbox Hook] Demo mode - no token available, prompting user");
        setNeedsToken(true);
        setIsLoading(false);
        return;
      }
      
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
      console.log("✅ [Mapbox Hook] Demo token saved and applied");
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

  return { mapToken, isLoading, error, retryFetchToken, needsToken, setDemoToken };
};
