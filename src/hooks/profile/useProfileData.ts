
import { useProfileFetch } from "./useProfileFetch";

export const useProfileData = () => {
  const {
    loading,
    formData,
    initialFormData,
    avatarUrl,
    setFormData,
    setInitialFormData,
    fetchProfile
  } = useProfileFetch();

  return {
    loading,
    formData,
    initialFormData,
    avatarUrl,
    setFormData,
    setInitialFormData,
    fetchProfile
  };
};
