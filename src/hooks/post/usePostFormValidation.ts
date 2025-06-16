
import type { PostFormData } from "@/types/post";

export function usePostFormValidation() {
  const validateForm = (formData: PostFormData): boolean => {
    return !!(
      formData.title?.trim() &&
      formData.category &&
      formData.condition &&
      formData.coordinates &&
      formData.images.length > 0
    );
  };

  return {
    validateForm,
  };
}
