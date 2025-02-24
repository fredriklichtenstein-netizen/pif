
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import type { CreatePostInput } from "@/types/post";
import { useNavigate } from "react-router-dom";
import { PostFormSteps } from "./PostFormSteps";
import { ImageCropperDialog } from "./ImageCropperDialog";

interface PostFormContainerProps {
  formData: CreatePostInput;
  isSubmitting: boolean;
  isGeocoding: boolean;
  isAnalyzing: boolean;
  onFormSubmit: (e: React.FormEvent) => Promise<void>;
  onGeocodeAddress: () => Promise<void>;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMeasurementChange: (field: string, value: string) => void;
  setFormData: (formData: CreatePostInput | ((prev: CreatePostInput) => CreatePostInput)) => void;
}

export function PostFormContainer({
  formData,
  isSubmitting,
  isGeocoding,
  isAnalyzing,
  onFormSubmit,
  onGeocodeAddress,
  onImageUpload,
  onMeasurementChange,
  setFormData,
}: PostFormContainerProps) {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 pb-32 pt-4"> {/* Increased bottom padding */}
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
          isGeocoding={isGeocoding}
          onImageUpload={onImageUpload}
          onGeocodeAddress={onGeocodeAddress}
          onMeasurementChange={onMeasurementChange}
          setFormData={setFormData}
        />

        <Button
          type="submit"
          className="w-full mb-24" /* Added margin bottom */
          disabled={isSubmitting || formData.images.length === 0 || !formData.title || !formData.location}
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

      <ImageCropperDialog formData={formData} setFormData={setFormData} />
    </div>
  );
}
