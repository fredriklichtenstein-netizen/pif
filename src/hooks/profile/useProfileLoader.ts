
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProfileFormData } from "./types";
import { parseProfileFromDatabase } from "./utils/profileDataUtils";

/**
 * Hook for loading user profile data from database
 */
export const useProfileLoader = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  /**
   * Fetches user profile data from the database
   * @returns {Promise<{avatarUrl: string, profileData: ProfileFormData} | null>} Profile data or null if error
   */
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error("No user found");

      // Log the user to debug
      console.log("Fetching profile for user:", user.id);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Log the retrieved profile data
      console.log("Retrieved profile data:", profile);

      if (profile) {
        const result = parseProfileFromDatabase(profile);
        return result;
      }
      return null;
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetchProfile
  };
};
