
import React from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ImageUploadProps {
  isAnalyzing?: boolean;
  uploadProgress?: number;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isPrimaryImageRequired?: boolean;
  variant: 'primary' | 'secondary';
}

export function ImageUpload({ 
  isAnalyzing, 
  uploadProgress = 0,
  onImageUpload, 
  isPrimaryImageRequired,
  variant
}: ImageUploadProps) {
  const isPrimary = variant === 'primary';

  return (
    <label className={`
      relative block border-2 border-dashed rounded-lg cursor-pointer 
      transition-colors
      ${isPrimary 
        ? 'h-60 border-primary hover:bg-primary/5' 
        : 'h-40 aspect-square border-gray-300 hover:border-primary'
      }
      ${isAnalyzing ? 'opacity-70 cursor-wait' : ''}
    `}>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        {isAnalyzing ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <span className="text-sm text-primary font-medium">Uploading...</span>
            {uploadProgress > 0 && (
              <div className="w-4/5 mt-2">
                <Progress value={uploadProgress} className="h-2" />
                <span className="text-xs text-muted-foreground mt-1">{uploadProgress}% complete</span>
              </div>
            )}
            {!uploadProgress && (
              <span className="text-xs text-muted-foreground mt-1">Please wait</span>
            )}
          </>
        ) : (
          <>
            <ImagePlus className={`mb-2 ${isPrimary ? 'h-10 w-10 text-primary' : 'h-8 w-8 text-gray-400'}`} />
            <span className={`text-sm text-center ${isPrimary ? 'text-primary font-medium' : 'text-gray-500'}`}>
              {isPrimaryImageRequired 
                ? "Upload primary photo (Required)" 
                : "Add more photos"}
            </span>
            {isPrimary && (
              <span className="text-xs text-muted-foreground mt-1">
                Click or drag and drop
              </span>
            )}
          </>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        multiple={!isPrimaryImageRequired}
        className="hidden"
        onChange={onImageUpload}
        required={isPrimaryImageRequired}
        aria-label={isPrimaryImageRequired ? "Upload primary image" : "Upload additional images"}
        disabled={isAnalyzing}
      />
    </label>
  );
}
