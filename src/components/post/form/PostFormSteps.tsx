
import React from "react";
import type { CreatePostInput } from "@/types/post";
import { PostFormImages } from "./PostFormImages";
import { PostFormDetails } from "./PostFormDetails";
import { PostFormLocation } from "./PostFormLocation";

interface PostFormStepsProps {
  formData: CreatePostInput;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGeocodeAddress: () => Promise<void>;
  onMeasurementChange: (field: string, value: string) => void;
  setFormData: (formData: CreatePostInput | ((prev: CreatePostInput) => CreatePostInput)) => void;
}

export function PostFormSteps({
  formData,
  onImageUpload,
  onGeocodeAddress,
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
          setFormData={setFormData}
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
        <h2 className="text-lg font-semibold">3. Location</h2>
        <PostFormLocation
          location={formData.location}
          onChange={(address) => {
            setFormData(prev => ({ ...prev, location: address }));
            if (address) {
              onGeocodeAddress();
            }
          }}
        />
      </div>
    </>
  );
}
