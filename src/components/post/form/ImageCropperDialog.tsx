import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ImageCropper } from "@/components/profile/ImageCropper";
import { getCroppedImg } from "@/utils/image";

interface ImageCropperDialogProps {
  cropImage: string | null;
  selectedImageIndex: number | null;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

export function ImageCropperDialog({ 
  cropImage,
  selectedImageIndex,
  onCropComplete,
  onCancel
}: ImageCropperDialogProps) {
  const handleCropComplete = async (croppedAreaPixels: any) => {
    if (!cropImage) return;
    
    const croppedImageFile = await getCroppedImg(cropImage, croppedAreaPixels, 'rect');
    if (!croppedImageFile) return;

    const croppedImageUrl = URL.createObjectURL(croppedImageFile);
    onCropComplete(croppedImageUrl);
  };

  return (
    <Dialog open={!!cropImage} onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        {cropImage && (
          <ImageCropper
            image={cropImage}
            onSave={handleCropComplete}
            onCancel={onCancel}
            cropShape="rect"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
