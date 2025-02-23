
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { CreatePostInput } from "@/types/post";
import { PostFormHeader } from "./form/PostFormHeader";
import { PostFormMeasurements } from "./form/PostFormMeasurements";
import { PostFormDescription } from "./form/PostFormDescription";
import { PostFormImages } from "./form/PostFormImages";
import { AddressInput } from "@/components/profile/address/AddressInput";

interface PostFormProps {
  formData: CreatePostInput;
  isSubmitting: boolean;
  isGeocoding: boolean;
  isAnalyzing: boolean;
  onFormSubmit: (e: React.FormEvent) => Promise<void>;
  onGeocodeAddress: () => Promise<void>;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyzeImages: () => Promise<void>;
  onMeasurementChange: (field: string, value: string) => void;
  setFormData: (formData: CreatePostInput | ((prev: CreatePostInput) => CreatePostInput)) => void;
}

export function PostForm({
  formData,
  isSubmitting,
  isGeocoding,
  isAnalyzing,
  onFormSubmit,
  onGeocodeAddress,
  onImageUpload,
  onAnalyzeImages,
  onMeasurementChange,
  setFormData,
}: PostFormProps) {
  const [hasUploadedPrimaryImage, setHasUploadedPrimaryImage] = useState(false);

  return (
    <div className="container mx-auto px-4 pb-20 pt-4">
      <h1 className="text-2xl font-bold mb-6">Create Post</h1>
      
      <form onSubmit={onFormSubmit} className="space-y-8 max-w-2xl mx-auto">
        {/* Step 1 & 2: Image Upload Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">1. Upload Images</h2>
          <PostFormImages
            images={formData.images}
            isAnalyzing={isAnalyzing}
            onImageUpload={(e) => {
              onImageUpload(e);
              if (!hasUploadedPrimaryImage && e.target.files && e.target.files.length > 0) {
                setHasUploadedPrimaryImage(true);
              }
            }}
            isPrimaryImageRequired={!hasUploadedPrimaryImage}
          />
          
          {/* Step 3: AI Analysis Option */}
          {hasUploadedPrimaryImage && (
            <Button 
              type="button"
              onClick={onAnalyzeImages}
              disabled={isAnalyzing}
              variant="outline"
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing images...
                </>
              ) : (
                "Analyze images with AI"
              )}
            </Button>
          )}
        </div>

        {/* Step 4: Item Details */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">2. Item Details</h2>
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
            measurements={formData.measurements}
            onMeasurementChange={onMeasurementChange}
          />
        </div>

        {/* Step 5: Location */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">3. Location</h2>
          <AddressInput
            value={formData.location}
            hideSearch={true}
            onChange={(address) => {
              setFormData(prev => ({ ...prev, location: address }));
              if (address) {
                onGeocodeAddress();
              }
            }}
          />
        </div>

        {/* Step 6: Submit */}
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || !hasUploadedPrimaryImage || !formData.title || !formData.location}
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
