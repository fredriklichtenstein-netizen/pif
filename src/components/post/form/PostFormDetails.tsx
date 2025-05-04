
import React from "react";
import type { CreatePostInput } from "@/types/post";
import { PostFormHeader } from "./PostFormHeader";
import { PostFormDescription } from "./PostFormDescription";
import { PostFormMeasurements } from "./PostFormMeasurements";

interface PostFormDetailsProps {
  formData: CreatePostInput;
  onMeasurementChange: (field: string, value: string) => void;
  setFormData: (formData: CreatePostInput | ((prev: CreatePostInput) => CreatePostInput)) => void;
}

export function PostFormDetails({
  formData,
  onMeasurementChange,
  setFormData,
}: PostFormDetailsProps) {
  return (
    <>
      <PostFormHeader
        title={formData.title}
        category={formData.category}
        condition={formData.condition}
        onTitleChange={(title) => setFormData(prev => ({ ...prev, title }))}
        onCategoryChange={(category) => setFormData(prev => ({ ...prev, category }))}
        onConditionChange={(condition) => setFormData(prev => ({ ...prev, condition }))}
      />

      <PostFormDescription
        description={formData.description}
        onDescriptionChange={(description) => setFormData(prev => ({ ...prev, description }))}
      />

      <PostFormMeasurements
        category={formData.category}
        measurements={formData.measurements || {}}
        onMeasurementChange={onMeasurementChange}
      />
    </>
  );
}
