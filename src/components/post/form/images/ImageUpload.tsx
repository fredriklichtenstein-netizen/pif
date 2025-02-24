
import React from "react";
import { ImagePlus, Loader2 } from "lucide-react";

interface ImageUploadProps {
  isAnalyzing?: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isPrimaryImageRequired?: boolean;
}

export function ImageUpload({ 
  isAnalyzing, 
  onImageUpload, 
  isPrimaryImageRequired 
}: ImageUploadProps) {
  return (
    <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-40 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
      {isAnalyzing ? (
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      ) : (
        <>
          <ImagePlus className="h-8 w-8 mb-2 text-gray-400" />
          <span className="text-sm text-gray-500">
            {isPrimaryImageRequired ? "Add primary photo" : "Add more photos"}
          </span>
        </>
      )}
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onImageUpload}
        disabled={isAnalyzing}
        required={isPrimaryImageRequired}
      />
    </label>
  );
}
