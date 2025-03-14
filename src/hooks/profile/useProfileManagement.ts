
import { useState, useEffect } from "react";
import { useProfileAvatar } from "./useProfileAvatar";
import { useProfileData } from "./useProfileData";
import { useProfileSubmit } from "./useProfileSubmit";
import { useUnsavedChanges } from "./useUnsavedChanges";
import { useProfileInitialization } from "./useProfileInitialization";
import { useAvatarEffect } from "./useAvatarEffect";
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

  // Initialize profile data
  useProfileInitialization(fetchProfile, setAvatarUrl);

  // Handle avatar updates
  useAvatarEffect(avatar, handleAvatarUpdate);

  // Track unsaved changes
  const { hasUnsavedChanges } = useUnsavedChanges(formData, initialFormData);

  // Handle form submission
  const { submitting, handleSubmit } = useProfileSubmit(saveProfile);

  // Use combined loading state from all hooks
  useEffect(() => {
    setLoading(avatarLoading || profileLoading || submitting);
  }, [avatarLoading, profileLoading, submitting]);

  return {
    loading,
    formData,
    initialFormData,
    avatarUrl,
    setAvatar,
    setFormData,
    hasUnsavedChanges,
    handleSubmit,
  };
};
