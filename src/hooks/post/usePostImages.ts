
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface UsePostImagesProps {
  images: string[];
  onImagesChange: (newImages: string[]) => void;
}

export const usePostImages = ({ images, onImagesChange }: UsePostImagesProps) => {
  const { toast } = useToast();
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const handleDeleteImage = (index: number) => {
    const remainingImages = images.filter((_, i) => i !== index);
    
    // If we delete the primary image, set the next image as primary
    if (index === primaryImageIndex) {
      setPrimaryImageIndex(0);
    } else if (index < primaryImageIndex) {
      setPrimaryImageIndex(primaryImageIndex - 1);
    }

    onImagesChange(remainingImages);
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === primaryImageIndex) return;
    
    // Reorder images to put the primary image first
    const newImages = [...images];
    const [movedImage] = newImages.splice(index, 1);
    newImages.unshift(movedImage);
    setPrimaryImageIndex(0);
    
    onImagesChange(newImages);
  };

  const handleCropImage = (index: number) => {
    setCropImage(images[index]);
    setSelectedImageIndex(index);
  };

  const handleCropComplete = async (croppedImageUrl: string) => {
    if (selectedImageIndex === null) return;
    
    const newImages = [...images];
    newImages[selectedImageIndex] = croppedImageUrl;
    onImagesChange(newImages);
    
    setCropImage(null);
    setSelectedImageIndex(null);
  };

  const handleCropCancel = () => {
    setCropImage(null);
    setSelectedImageIndex(null);
  };

  return {
    primaryImageIndex,
    cropImage,
    selectedImageIndex,
    handleDeleteImage,
    handleSetPrimaryImage,
    handleCropImage,
    handleCropComplete,
    handleCropCancel,
  };
};

