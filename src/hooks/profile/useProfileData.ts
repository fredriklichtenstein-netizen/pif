
import { useProfileFetch } from "./useProfileFetch";

export const useProfileData = () => {
  const {
    loading,
    formData,
    initialFormData,
    avatarUrl,
    error,
    setFormData,
    setInitialFormData,
    fetchProfile,
    clearCache
  } = useProfileFetch();

  return {
    loading,
    formData,
    initialFormData,
    avatarUrl,
    error,
    setFormData,
    setInitialFormData,
    fetchProfile,
    clearCache
  };
};
