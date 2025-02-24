
import React from "react";
import type { CreatePostInput } from "@/types/post";
import { PostFormImages } from "./PostFormImages";
import { PostFormDetails } from "./PostFormDetails";
import { PostFormLocation } from "./PostFormLocation";
import { parseCoordinatesFromDB } from "@/types/post";
import { AddressInput } from "@/components/profile/address/AddressInput";

interface PostFormStepsProps {
  formData: CreatePostInput;
  isAnalyzing?: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMeasurementChange: (field: string, value: string) => void;
  setFormData: (formData: CreatePostInput | ((prev: CreatePostInput) => CreatePostInput)) => void;
}

export function PostFormSteps({
  formData,
  isAnalyzing,
  onImageUpload,
  onMeasurementChange,
  setFormData,
}: PostFormStepsProps) {
  return (
    <>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">1. Images</h2>
        <PostFormImages 
          images={formData.images} 
          onImageUpload={onImageUpload}
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
            onChange={(address) => {
              setFormData(prev => ({
                ...prev,
                location: address
              }));
            }}
          />
        </div>
      </div>
    </>
  );
}
