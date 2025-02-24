
import React from "react";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "./images/ImageUpload";
import { Trash2, Crop, Star } from "lucide-react";
import { usePostImages } from "@/hooks/post/usePostImages";
import { ImageCropperDialog } from "./ImageCropperDialog";

interface PostFormImagesProps {
  images: string[];
  isAnalyzing?: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImagesChange: (newImages: string[]) => void;
}

export function PostFormImages({ 
  images, 
  isAnalyzing,
  onImageUpload,
  onImagesChange
}: PostFormImagesProps) {
  const { 
    primaryImageIndex,
    cropImage,
    selectedImageIndex,
    handleDeleteImage,
    handleSetPrimaryImage,
    handleCropImage,
    handleCropComplete,
    handleCropCancel,
  } = usePostImages({
    images,
    onImagesChange
  });

  const isPrimaryImageRequired = images.length === 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="images" className="text-sm font-medium">
          {isPrimaryImageRequired ? "Upload Primary Image (Required)" : "Images"}
          {isAnalyzing && <span className="text-muted-foreground ml-2">(Analyzing...)</span>}
        </label>

        {isPrimaryImageRequired && (
          <div className="mt-2">
            <ImageUpload
              isAnalyzing={isAnalyzing}
              onImageUpload={onImageUpload}
              isPrimaryImageRequired={true}
              variant="primary"
            />
          </div>
        )}

        {images.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Image ${index + 1}`}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:text-white hover:bg-primary/50"
                      onClick={() => handleDeleteImage(index)}
                      aria-label="Delete image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:text-white hover:bg-primary/50"
                      onClick={() => handleCropImage(index)}
                      aria-label="Crop image"
                    >
                      <Crop className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={`text-white hover:text-white hover:bg-primary/50 ${index === primaryImageIndex ? 'text-yellow-400' : ''}`}
                      onClick={() => handleSetPrimaryImage(index)}
                      aria-label="Set as primary image"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  </div>
                  {index === primaryImageIndex && (
                    <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded-md text-xs">
                      Primary
                    </div>
                  )}
                </div>
              ))}
              
              <ImageUpload
                isAnalyzing={isAnalyzing}
                onImageUpload={onImageUpload}
                isPrimaryImageRequired={false}
                variant="secondary"
              />
            </div>
          </div>
        )}
      </div>

      <ImageCropperDialog
        cropImage={cropImage}
        selectedImageIndex={selectedImageIndex}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
      />
    </div>
  );
}

