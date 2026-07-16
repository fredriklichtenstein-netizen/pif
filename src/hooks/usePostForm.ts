
import { usePostImageUpload } from "./post/usePostImageUpload";
import { usePostFormState } from "./post/usePostFormState";
import { usePostFormSubmission } from "./post/usePostFormSubmission";
import { usePostFormValidation } from "./post/usePostFormValidation";
import type { ImageCrop } from "@/types/post";

export function usePostForm(initialData?: any) {
  const {
    formData,
    setFormData,
    profileDefaults,
    handleImagesChange,
    handleImageCropsChange,
    handleMeasurementChange,
  } = usePostFormState(initialData);

  const { isSubmitting, handleSubmit: submitForm } = usePostFormSubmission(initialData);
  const { validateForm } = usePostFormValidation();

  const { handleImageUpload: uploadHandler, isAnalyzing } = usePostImageUpload({
    onImagesUploaded: (uploaded) => {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploaded.map(u => u.url)],
        imageCrops: [...(prev.imageCrops || []), ...uploaded.map(u => u.crop)],
      }));
    }
  });

  const handleImageUpload = async (files: File[], crops: (ImageCrop | null)[] = []) => {
    await uploadHandler(files, crops);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm(formData);
  };

  const isFormValid = validateForm(formData);

  const isEditMode = Boolean(initialData?.id);

  return {
    formData,
    isSubmitting,
    isAnalyzing,
    isFormValid,
    isEditMode,
    profileDefaults,
    setFormData,
    handleImageUpload,
    handleImagesChange,
    handleImageCropsChange,
    handleMeasurementChange,
    handleSubmit,
  };
}
