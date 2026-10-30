
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

  const { isSubmitting, handleSubmit: submitForm, saveAsDraft } = usePostFormSubmission(initialData);
  const { validateForm } = usePostFormValidation();

  const { handleImageUpload: uploadHandler, uploadFiles, isAnalyzing } = usePostImageUpload({
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

  /** An already-added image was edited: `file` is the rotated/trimmed
   *  replacement (null when only its preview area changed). */
  const handleImageReplace = async (index: number, file: File | null, crop: ImageCrop | null) => {
    let url: string | null = null;
    if (file) {
      const [uploaded] = await uploadFiles([file], [crop]);
      if (!uploaded) return;
      url = uploaded.url;
    }
    setFormData(prev => {
      if (index >= prev.images.length) return prev;
      const images = [...prev.images];
      if (url) images[index] = url;
      const imageCrops = [...(prev.imageCrops || [])];
      while (imageCrops.length < images.length) imageCrops.push(null);
      imageCrops[index] = crop;
      return { ...prev, images, imageCrops };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm(formData);
  };

  const isFormValid = validateForm(formData);

  const isEditMode = Boolean(initialData?.id);
  const isDraftMode = Boolean(initialData?.draftId);

  const handleSaveDraft = (navigateTo?: string) => saveAsDraft(formData, undefined, navigateTo);
  const handleSchedule = (scheduledAt: Date) => saveAsDraft(formData, scheduledAt);

  return {
    formData,
    isSubmitting,
    isAnalyzing,
    isFormValid,
    isEditMode,
    isDraftMode,
    profileDefaults,
    setFormData,
    handleImageUpload,
    handleImageReplace,
    handleImagesChange,
    handleImageCropsChange,
    handleMeasurementChange,
    handleSubmit,
    handleSaveDraft,
    handleSchedule,
  };
}
