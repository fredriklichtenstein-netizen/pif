
import { usePostImageUpload } from "./post/usePostImageUpload";
import { usePostFormState } from "./post/usePostFormState";
import { usePostFormSubmission } from "./post/usePostFormSubmission";
import { usePostFormValidation } from "./post/usePostFormValidation";

export function usePostForm(initialData?: any) {
  const {
    formData,
    setFormData,
    handleImagesChange,
    handleMeasurementChange,
  } = usePostFormState(initialData);

  const { isSubmitting, handleSubmit: submitForm } = usePostFormSubmission(initialData);
  const { validateForm } = usePostFormValidation();

  const { handleImageUpload: uploadHandler, isAnalyzing } = usePostImageUpload({
    onImagesUploaded: (urls: string[]) => {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...urls]
      }));
    }
  });

  const handleImageUpload = async (file: File) => {
    // Create a synthetic event for the upload handler
    const fileList = new DataTransfer();
    fileList.items.add(file);
    
    const syntheticEvent = {
      target: {
        files: fileList.files
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    // Use the real upload handler to get permanent URLs
    await uploadHandler(syntheticEvent);
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
    setFormData,
    handleImageUpload,
    handleImagesChange,
    handleMeasurementChange,
    handleSubmit,
  };
}
