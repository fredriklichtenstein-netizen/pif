
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProfileFormData } from "./types";

/**
 * Hook for managing profile data operations
 * 
 * @returns Object containing profile state and methods
 * @property {boolean} loading - Indicates if a profile operation is in progress
 * @property {ProfileFormData} formData - Current profile form data
 * @property {ProfileFormData} initialFormData - Initial profile form data for comparison
 * @property {Function} setFormData - Set the form data
 * @property {Function} setInitialFormData - Set the initial form data
 * @property {Function} fetchProfile - Fetch profile data from the database
 * @property {Function} saveProfile - Save profile data to the database
 */
export const useProfileData = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    gender: "",
    phone: "",
    address: "",
    countryCode: "+46",
  });
  const [initialFormData, setInitialFormData] = useState({ ...formData });

  /**
   * Fetches user profile data from the database
   * @returns {Promise<{avatarUrl: string, profileData: ProfileFormData} | null>} Profile data or null if error
   */
  const fetchProfile = async () => {
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
        // Properly parse date of birth if it exists
        let dateOfBirth: Date | undefined = undefined;
        if (profile.date_of_birth) {
          console.log("Raw date_of_birth from database:", profile.date_of_birth);
          dateOfBirth = new Date(profile.date_of_birth);
          // Ensure it's a valid date
          if (isNaN(dateOfBirth.getTime())) {
            console.error("Invalid date format received:", profile.date_of_birth);
            dateOfBirth = undefined;
          } else {
            console.log("Parsed dateOfBirth:", dateOfBirth);
          }
        }
        
        const profileData = {
          firstName: profile.first_name || "",
          lastName: profile.last_name || "",
          gender: profile.gender || "",
          phone: profile.phone || "",
          address: profile.address || "",
          countryCode: "+46", // Default country code if not stored
          dateOfBirth: dateOfBirth,
        };
        
        setFormData(profileData);
        setInitialFormData(profileData);
        
        return {
          avatarUrl: profile.avatar_url,
          profileData
        };
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
    }
  };

  /**
   * Saves profile data to the database
   * @returns {Promise<boolean>} Success status
   */
  const saveProfile = async () => {
    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error("No user found");

      // Format phone to remove leading zero
      let formattedPhone = formData.phone;
      if (formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone.substring(1);
      }

      // Format date of birth for database storage
      let formattedDateOfBirth = null;
      if (formData.dateOfBirth) {
        // Ensure we have a valid date object
        if (formData.dateOfBirth instanceof Date && !isNaN(formData.dateOfBirth.getTime())) {
          formattedDateOfBirth = formData.dateOfBirth.toISOString().split('T')[0];
          console.log("Formatted date for database storage:", formattedDateOfBirth);
        } else {
          console.error("Invalid date object:", formData.dateOfBirth);
        }
      }

      // Log what we're saving to the database
      console.log("Saving profile with data:", {
        first_name: formData.firstName,
        last_name: formData.lastName,
        gender: formData.gender,
        phone: formattedPhone,
        address: formData.address,
        date_of_birth: formattedDateOfBirth,
      });

      const { error: updateError, data: updatedData } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          gender: formData.gender,
          phone: formattedPhone,
          address: formData.address,
          date_of_birth: formattedDateOfBirth,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      console.log("Profile update response:", updatedData);

      // Update the initial form data to reflect the current state
      setInitialFormData({ 
        ...formData,
        phone: formattedPhone
      });
      
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
    formData,
    initialFormData,
    setFormData,
    setInitialFormData,
    fetchProfile,
    saveProfile
  };
};
