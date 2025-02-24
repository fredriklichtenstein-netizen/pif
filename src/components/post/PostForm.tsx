
import React from "react";
import { PostFormContainer } from "./form/PostFormContainer";
import { usePostForm } from "@/hooks/usePostForm";
import { useMapbox } from "@/hooks/useMapbox";
import { usePostLocation } from "@/hooks/post/usePostLocation";

export function PostForm() {
  const { mapToken } = useMapbox();
  const {
    formData,
    isSubmitting,
    isAnalyzing,
    setFormData,
    handleImageUpload,
    handleImagesChange,
    handleMeasurementChange,
    handleSubmit,
  } = usePostForm();

  const { handleAddressSelect } = usePostLocation(formData, setFormData);

  if (!mapToken) {
    return <div>Loading map configuration...</div>;
  }

  return (
    <PostFormContainer
      formData={formData}
      isSubmitting={isSubmitting}
      isAnalyzing={isAnalyzing}
      onFormSubmit={handleSubmit}
      onImageUpload={handleImageUpload}
      onImagesChange={handleImagesChange}
      onMeasurementChange={handleMeasurementChange}
      setFormData={setFormData}
      onAddressSelect={handleAddressSelect}
    />
  );
}
