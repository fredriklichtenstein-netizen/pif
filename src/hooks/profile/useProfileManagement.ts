
import { useState } from "react";
import { useProfileData } from "./useProfileData";
import { useProfileSubmit } from "./useProfileSubmit";
import { useProfileAvatar } from "./useProfileAvatar";
import { ProfileFormData } from "./types";

export type { ProfileFormData } from "./types";

export const useProfileManagement = () => {
  const {
    loading: dataLoading,
    formData,
    initialFormData,
    avatarUrl,
    setFormData,
    setInitialFormData
  } = useProfileData();

  const { loading: submitLoading, handleSubmit } = useProfileSubmit(
    formData,
    setInitialFormData
  );

  const {
    loading: avatarLoading,
    setAvatar,
    setAvatarUrl
  } = useProfileAvatar();

  // Combine loading states
  const loading = dataLoading || submitLoading || avatarLoading;

  return {
    loading,
    formData,
    initialFormData,
    avatarUrl,
    setFormData,
    setInitialFormData,
    setAvatar,
    handleSubmit,
  };
};
