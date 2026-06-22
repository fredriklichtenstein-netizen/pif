import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ImageCropper } from "@/components/profile/ImageCropper";
import { getCroppedImg } from "@/utils/image";
import { useTranslation } from "react-i18next";

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
  onCancel,
}: ImageCropperDialogProps) {
  const { t } = useTranslation();

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
        <DialogHeader>
          <DialogTitle>
            {t("post.crop_image", { defaultValue: "Beskär bild" })}
          </DialogTitle>
          <DialogDescription>
            {t("post.crop_image_description", {
              defaultValue:
                "Dra bilden för att justera positionen och använd reglaget för att zooma in eller ut.",
            })}
          </DialogDescription>
        </DialogHeader>
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
