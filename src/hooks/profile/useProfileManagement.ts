
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
    error,
    setFormData,
    setInitialFormData,
    clearCache
  } = useProfileData();

  const { loading: submitLoading, error: submitError, handleSubmit } = useProfileSubmit(
    formData,
    setInitialFormData,
    clearCache
  );

  const {
    loading: avatarLoading,
    setAvatar,
    setAvatarUrl
  } = useProfileAvatar();

  // Combine loading states
  const loading = dataLoading || submitLoading || avatarLoading;

  // Combine errors
  const combinedError = error || submitError || null;

  return {
    loading,
    formData,
    initialFormData,
    avatarUrl,
    error: combinedError,
    setFormData,
    setInitialFormData,
    setAvatar,
    handleSubmit,
  };
};
