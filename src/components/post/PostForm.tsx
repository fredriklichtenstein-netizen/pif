
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, X } from "lucide-react";
import type { CreatePostInput } from "@/types/post";
import { PostFormHeader } from "./form/PostFormHeader";
import { PostFormMeasurements } from "./form/PostFormMeasurements";
import { PostFormDescription } from "./form/PostFormDescription";
import { PostFormImages } from "./form/PostFormImages";
import { AddressInput } from "@/components/profile/address/AddressInput";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ImageCropper } from "@/components/profile/ImageCropper";
import { getCroppedImg } from "@/utils/imageProcessing";

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
  onFormSubmit,
  onGeocodeAddress,
  onImageUpload,
  onMeasurementChange,
  setFormData,
}: PostFormProps) {
  const navigate = useNavigate();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [cropImage, setCropImage] = useState<string | null>(null);

  const handleDeleteImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleCropComplete = async (croppedAreaPixels: any) => {
    if (!cropImage) return;
    
    const croppedImageFile = await getCroppedImg(cropImage, croppedAreaPixels);
    if (!croppedImageFile) return;

    const croppedImageUrl = URL.createObjectURL(croppedImageFile);
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, idx) => 
        idx === selectedImageIndex ? croppedImageUrl : img
      )
    }));

    setCropImage(null);
    setSelectedImageIndex(null);
  };

  return (
    <div className="container mx-auto px-4 pb-20 pt-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create Post</h1>
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="text-gray-500"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <form onSubmit={onFormSubmit} className="space-y-8 max-w-2xl mx-auto">
        {/* Step 1: Image Upload Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">1. Images</h2>
          <div className="space-y-4">
            {formData.images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-60 object-cover rounded-lg"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedImageIndex(index);
                      setCropImage(image);
                    }}
                  >
                    Crop
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteImage(index)}
                  >
                    Delete
                  </Button>
                </div>
                {index === 0 && (
                  <span className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded-md text-xs">
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
          <PostFormImages
            images={formData.images}
            onImageUpload={onImageUpload}
            isPrimaryImageRequired={formData.images.length === 0}
          />
        </div>

        {/* Step 2: Item Details */}
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

        {/* Step 3: Location */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">3. Location</h2>
          <div className="space-y-2">
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
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
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

      {/* Image Cropper Dialog */}
      <Dialog open={!!cropImage} onOpenChange={() => setCropImage(null)}>
        <DialogContent className="sm:max-w-[425px]">
          {cropImage && (
            <ImageCropper
              image={cropImage}
              onSave={handleCropComplete}
              onCancel={() => {
                setCropImage(null);
                setSelectedImageIndex(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
