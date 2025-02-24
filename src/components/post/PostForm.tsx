
import React from "react";
import { PostFormContainer } from "./form/PostFormContainer";
import { usePostForm } from "@/hooks/usePostForm";
import { useMapbox } from "@/hooks/useMapbox";

export function PostForm() {
  const { mapToken } = useMapbox();
  const {
    formData,
    isSubmitting,
    isGeocoding,
    isAnalyzing,
    setFormData,
    handleGeocodeAddress,
    handleImageUpload,
    handleAnalyzeImages,
    handleMeasurementChange,
    handleSubmit,
  } = usePostForm();

  if (!mapToken) {
    return <div>Loading map configuration...</div>;
  }

  return (
    <PostFormContainer
      formData={formData}
      isSubmitting={isSubmitting}
      isGeocoding={isGeocoding}
      isAnalyzing={isAnalyzing}
      onFormSubmit={handleSubmit}
      onGeocodeAddress={() => handleGeocodeAddress(mapToken)}
      onImageUpload={handleImageUpload}
      onMeasurementChange={handleMeasurementChange}
      setFormData={setFormData}
    />
  );
}
