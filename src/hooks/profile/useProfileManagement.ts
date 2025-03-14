
import { useState, useEffect } from "react";
import { useProfileAvatar } from "./useProfileAvatar";
import { useProfileData } from "./useProfileData";
import { ProfileFormData } from "./types";

export type { ProfileFormData } from "./types";

/**
 * A comprehensive hook that combines avatar and profile data management
 * to provide a unified interface for profile management functionality
 */
export const useProfileManagement = () => {
  const {
    loading: avatarLoading,
    avatar,
    avatarUrl,
    setAvatar,
    setAvatarUrl,
    handleAvatarUpdate
  } = useProfileAvatar();

  const {
    loading: profileLoading,
    formData,
    initialFormData,
    setFormData,
    setInitialFormData,
    fetchProfile,
    saveProfile
  } = useProfileData();

  const [loading, setLoading] = useState(false);

  // Debug log to track the lifecycle
  console.log("useProfileManagement hook running");

  // Load profile data on initial mount
  useEffect(() => {
    console.log("useProfileManagement: Initial profile load effect running");
    const loadProfile = async () => {
      console.log("useProfileManagement: Loading profile data");
      const profileData = await fetchProfile();
      if (profileData?.avatarUrl) {
        setAvatarUrl(profileData.avatarUrl);
      }
    };
    loadProfile();
  }, []);

  // Handle avatar update when avatar changes
  useEffect(() => {
    if (avatar) {
      handleAvatarUpdate();
    }
  }, [avatar]);

  /**
   * Handle profile form submission
   * @param {React.FormEvent} e - Form event
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Safely log form data with date validation
    const formDataLog = {
      ...formData,
      dateOfBirth: formData.dateOfBirth instanceof Date && !isNaN(formData.dateOfBirth.getTime()) 
        ? formData.dateOfBirth.toISOString() 
        : undefined
    };
    
    console.log("useProfileManagement: Form submitted with data:", formDataLog);
    
    await saveProfile();
  };

  // Use combined loading state from both hooks
  useEffect(() => {
    setLoading(avatarLoading || profileLoading);
  }, [avatarLoading, profileLoading]);

  return {
    loading,
    formData,
    initialFormData,
    avatarUrl,
    setAvatar,
    setFormData,
    handleSubmit,
  };
};
