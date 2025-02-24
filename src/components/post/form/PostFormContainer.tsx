
import React from "react";
import { PostFormHeader } from "./PostFormHeader";
import { PostFormSteps } from "./PostFormSteps";
import type { CreatePostInput } from "@/types/post";

interface PostFormContainerProps {
  formData: CreatePostInput;
  isSubmitting: boolean;
  isAnalyzing?: boolean;
  onFormSubmit: (e: React.FormEvent) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImagesChange: (newImages: string[]) => void;
  onMeasurementChange: (field: string, value: string) => void;
  setFormData: (formData: CreatePostInput | ((prev: CreatePostInput) => CreatePostInput)) => void;
  onAddressSelect: (address: string, coordinates?: { lat: number; lng: number }) => void;
}

export function PostFormContainer({
  formData,
  isSubmitting,
  isAnalyzing,
  onFormSubmit,
  onImageUpload,
  onImagesChange,
  onMeasurementChange,
  setFormData,
  onAddressSelect,
}: PostFormContainerProps) {
  return (
    <form onSubmit={onFormSubmit} className="space-y-8 max-w-2xl mx-auto p-4">
      <PostFormHeader isSubmitting={isSubmitting} />
      <PostFormSteps
        formData={formData}
        isAnalyzing={isAnalyzing}
        onImageUpload={onImageUpload}
        onImagesChange={onImagesChange}
        onMeasurementChange={onMeasurementChange}
        setFormData={setFormData}
        onAddressSelect={onAddressSelect}
      />
    </form>
  );
}

