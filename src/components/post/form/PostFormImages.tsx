
import React from "react";
import { ImagePreview } from "./images/ImagePreview";
import { ImageUpload } from "./images/ImageUpload";

interface PostFormImagesProps {
  images: string[];
  isAnalyzing?: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function PostFormImages({ 
  images, 
  isAnalyzing, 
  onImageUpload 
}: PostFormImagesProps) {
  const isPrimaryImageRequired = images.length === 0;

  return (
    <div className="space-y-2">
      <label htmlFor="images" className="text-sm font-medium">
        {isPrimaryImageRequired ? "Upload Primary Image (Required)" : "Add More Images"}
        {isAnalyzing && <span className="text-muted-foreground ml-2">(Analyzing...)</span>}
      </label>
      <div className="grid grid-cols-2 gap-4 mt-2">
        <ImagePreview images={images} />
        <ImageUpload
          isAnalyzing={isAnalyzing}
          onImageUpload={onImageUpload}
          isPrimaryImageRequired={isPrimaryImageRequired}
        />
      </div>
    </div>
  );
}
