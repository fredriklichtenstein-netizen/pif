
import React from "react";
import type { CreatePostInput } from "@/types/post";
import { PostFormImages } from "./PostFormImages";
import { PostFormDetails } from "./PostFormDetails";
import { AddressInput } from "@/components/profile/address/AddressInput";

interface PostFormStepsProps {
  formData: CreatePostInput;
  isAnalyzing?: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImagesChange: (newImages: string[]) => void;
  onMeasurementChange: (field: string, value: string) => void;
  setFormData: (formData: CreatePostInput | ((prev: CreatePostInput) => CreatePostInput)) => void;
  onAddressSelect: (address: string, coordinates?: { lat: number; lng: number }) => void;
}

export function PostFormSteps({
  formData,
  isAnalyzing,
  onImageUpload,
  onImagesChange,
  onMeasurementChange,
  setFormData,
  onAddressSelect,
}: PostFormStepsProps) {
  return (
    <>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">1. Images</h2>
        <PostFormImages 
          images={formData.images} 
          onImageUpload={onImageUpload}
          onImagesChange={onImagesChange}
          isAnalyzing={isAnalyzing}
        />
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold">2. Item Details</h2>
        <PostFormDetails
          formData={formData}
          onMeasurementChange={onMeasurementChange}
          setFormData={setFormData}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">3. Pick-up Info</h2>
        <div className="space-y-2">
          <label htmlFor="location" className="text-sm font-medium">
            Pick-up location
          </label>
          <AddressInput
            value={formData.location}
            onChange={onAddressSelect}
          />
          <p className="text-sm text-muted-foreground mt-1">
            For privacy reasons, only the general area will be shown on the map and in the feed.
          </p>
        </div>
      </div>
    </>
  );
}
