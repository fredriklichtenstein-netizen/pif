
import React from "react";
import { PostFormContainer } from "./form/PostFormContainer";
import { usePostForm } from "@/hooks/usePostForm";
import { useMapbox } from "@/hooks/useMapbox";

export function PostForm() {
  const { mapToken } = useMapbox();
  const {
    formData,
    isSubmitting,
    isAnalyzing,
    setFormData,
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
      isAnalyzing={isAnalyzing}
      onFormSubmit={handleSubmit}
      onImageUpload={handleImageUpload}
      onMeasurementChange={handleMeasurementChange}
      setFormData={setFormData}
    />
  );
}
