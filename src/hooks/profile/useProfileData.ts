
import { useState } from "react";
import { ProfileFormData } from "./types";
import { useProfileLoader } from "./useProfileLoader";
import { useProfileSaver } from "./useProfileSaver";

/**
 * Hook for managing profile data operations
 * 
 * @returns Object containing profile state and methods
 */
export const useProfileData = () => {
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    gender: "",
    phone: "",
    address: "",
    countryCode: "+46",
  });
  const [initialFormData, setInitialFormData] = useState({ ...formData });

  const { loading: loadingProfile, fetchProfile } = useProfileLoader();
  const { loading: savingProfile, saveProfile } = useProfileSaver();
  
  // Combined loading state
  const loading = loadingProfile || savingProfile;

  /**
   * Fetch profile wrapper that updates state
   */
  const fetchProfileData = async () => {
    const result = await fetchProfile();
    if (result) {
      setFormData(result.profileData);
      setInitialFormData({...result.profileData});
      return result;
    }
    return null;
  };

  /**
   * Save profile wrapper
   */
  const saveProfileData = async () => {
    const success = await saveProfile(formData);
    if (success) {
      // Update the initial form data to reflect the current state
      setInitialFormData({ ...formData });
    }
    return success;
  };

  return {
    loading,
    formData,
    initialFormData,
    setFormData,
    setInitialFormData,
    fetchProfile: fetchProfileData,
    saveProfile: saveProfileData
  };
};
