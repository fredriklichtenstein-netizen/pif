
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import type { CreatePostInput } from "@/types/post";
import { useNavigate } from "react-router-dom";
import { PostFormSteps } from "./PostFormSteps";

interface PostFormContainerProps {
  formData: CreatePostInput;
  isSubmitting: boolean;
  isAnalyzing: boolean;
  isFormValid: boolean;
  onFormSubmit: (e: React.FormEvent) => Promise<void>;
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
  isFormValid,
  onFormSubmit,
  onImageUpload,
  onImagesChange,
  onMeasurementChange,
  setFormData,
  onAddressSelect,
}: PostFormContainerProps) {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 pb-32 pt-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" tabIndex={0}>Create Post</h1>
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="text-gray-500"
          aria-label="Close form"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <form onSubmit={onFormSubmit} className="space-y-8 max-w-2xl mx-auto">
        <PostFormSteps
          formData={formData}
          isAnalyzing={isAnalyzing}
          onImageUpload={onImageUpload}
          onImagesChange={onImagesChange}
          onMeasurementChange={onMeasurementChange}
          setFormData={setFormData}
          onAddressSelect={onAddressSelect}
        />

        <Button
          type="submit"
          className="w-full mb-24"
          disabled={isSubmitting || !isFormValid}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            "Publish Post"
          )}
        </Button>
      </form>
    </div>
  );
}
