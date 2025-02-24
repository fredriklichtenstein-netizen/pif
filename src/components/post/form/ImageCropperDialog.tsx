
import React, { useState } from "react";
import type { CreatePostInput } from "@/types/post";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ImageCropper } from "@/components/profile/ImageCropper";
import { getCroppedImg } from "@/utils/imageProcessing";

interface ImageCropperDialogProps {
  formData: CreatePostInput;
  setFormData: (formData: CreatePostInput | ((prev: CreatePostInput) => CreatePostInput)) => void;
}

export function ImageCropperDialog({ formData, setFormData }: ImageCropperDialogProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [cropImage, setCropImage] = useState<string | null>(null);

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
  );
}
