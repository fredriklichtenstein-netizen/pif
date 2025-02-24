
import React from "react";
import { PostFormContainer } from "./form/PostFormContainer";
import { usePostForm } from "@/hooks/usePostForm";

export function PostForm() {
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

  return (
    <PostFormContainer
      formData={formData}
      isSubmitting={isSubmitting}
      isGeocoding={isGeocoding}
      isAnalyzing={isAnalyzing}
      onFormSubmit={handleSubmit}
      onGeocodeAddress={handleGeocodeAddress}
      onImageUpload={handleImageUpload}
      onMeasurementChange={handleMeasurementChange}
      setFormData={setFormData}
    />
  );
}
