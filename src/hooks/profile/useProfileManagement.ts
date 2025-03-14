
import { useState, useEffect } from "react";
import { useProfileAvatar } from "./useProfileAvatar";
import { useProfileData } from "./useProfileData";
import { ProfileFormData } from "./types";

export type { ProfileFormData } from "./types";

/**
 * A comprehensive hook that combines avatar and profile data management
 * to provide a unified interface for profile management functionality
 * 
 * @returns Object containing combined profile state and methods
 * @property {boolean} loading - Indicates if any profile operation is in progress
 * @property {ProfileFormData} formData - Current profile form data
 * @property {ProfileFormData} initialFormData - Initial profile form data
 * @property {string|null} avatarUrl - URL of the current avatar
 * @property {Function} setAvatar - Set the avatar file
 * @property {Function} setFormData - Set the form data
 * @property {Function} handleSubmit - Handle profile form submission
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

  // Load profile data on initial mount
  useEffect(() => {
    const loadProfile = async () => {
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
