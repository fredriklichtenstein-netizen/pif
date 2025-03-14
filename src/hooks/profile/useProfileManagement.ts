
import { useState, useEffect } from "react";
import { useProfileAvatar } from "./useProfileAvatar";
import { useProfileData } from "./useProfileData";
import { ProfileFormData } from "./types";

export type { ProfileFormData } from "./types";

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

  useEffect(() => {
    const loadProfile = async () => {
      const profileData = await fetchProfile();
      if (profileData?.avatarUrl) {
        setAvatarUrl(profileData.avatarUrl);
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (avatar) {
      handleAvatarUpdate();
    }
  }, [avatar]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProfile();
  };

  // Use combined loading state
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
