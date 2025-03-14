
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProfileFormData } from "./types";
import { formatProfileForDatabase } from "./utils/profileDataUtils";

/**
 * Hook for saving user profile data to database
 */
export const useProfileSaver = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  /**
   * Saves profile data to the database
   * @param {ProfileFormData} formData - The profile data to save
   * @returns {Promise<boolean>} Success status
   */
  const saveProfile = async (formData: ProfileFormData) => {
    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error("No user found");

      const profileData = formatProfileForDatabase(formData, user.id);

      // Log what we're saving to the database
      console.log("Saving profile with data:", profileData);

      const { error: updateError, data: updatedData } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (updateError) throw updateError;

      console.log("Profile update response:", updatedData);
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      return true;
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    saveProfile
  };
};
